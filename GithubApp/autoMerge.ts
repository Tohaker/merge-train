import { PullRequest, StatusEvent } from "@octokit/webhooks-types";
import { Label as PullRequestLabel, Commit } from "@octokit/graphql-schema";
import {
  getQueue,
  getItems,
  getMergeableItemsState,
  isMergeable,
} from "../graphql/queue";
import { Branch, Label, mergeMethods } from "../common/config";
import {
  addLabelToPullRequest,
  getCommitStatus,
  mergePullRequest,
  createClient,
  Queue,
} from "../graphql";
import { graphql } from "@octokit/graphql/dist-types/types";
import { Client } from "./types";
import { formatLink } from "./client";

const getLabels = (queue: Queue): PullRequestLabel[] =>
  queue.repository.pullRequests.nodes?.reduce(
    (acc, pr) => acc.concat(pr.labels?.nodes),
    []
  );

const isPaused = (labels: PullRequestLabel[]) =>
  labels?.some((label) => label.name === Label.MERGE_TRAIN_PAUSED);

const mergePR = async (
  graphqlClient: graphql,
  prId: string,
  branchName: string
) => {
  const { mergeMethod } = mergeMethods.find(({ branch }) =>
    branch.test(branchName)
  );

  await graphqlClient(mergePullRequest, {
    prId,
    mergeMethod,
  });
};

export const handleItemAdded = async (
  client: Client,
  pullRequest: PullRequest,
  channel: string
) => {
  const queue = await getQueue();
  const labels = getLabels(queue);
  const graphqlClient = await createClient();

  const paused = isPaused(labels);

  if (getItems(queue).length > 1) {
    console.log("Queue was not empty, no new merges to perform");

    if (paused) {
      console.log("Pausing this PR");

      await graphqlClient(addLabelToPullRequest, {
        labelId: labels.find(({ name }) => name === Label.MERGE_TRAIN_PAUSED)
          .id,
        pullRequestId: pullRequest.node_id,
      });
    }

    return;
  }

  if (paused) {
    console.log("Queue paused");
    return;
  }

  const headCommitUrl = queue.repository?.defaultBranchRef?.target?.commitUrl;
  const resource =
    headCommitUrl &&
    (
      await graphqlClient<{ resource: Commit }>(getCommitStatus, {
        commitRef: headCommitUrl,
      })
    ).resource;
  const state = resource?.status?.state;
  if (state === "SUCCESS") {
    if (pullRequest.mergeable) {
      const id = pullRequest.node_id;
      const branch = pullRequest.head.ref;

      console.log(`Merging: ${pullRequest.title}`);

      const shouldMerge = process.env.MERGE_ENABLED === "true";
      shouldMerge && (await mergePR(graphqlClient, id, branch));
    } else {
      await client.postSimpleMessage(
        `${formatLink({
          text: pullRequest.title,
          url: pullRequest.html_url,
        })} cannot be merged yet, remove the label until this is resolved.`,
        channel
      );
    }
  }
};

export const handleStateReported = async (
  client: Client,
  body: StatusEvent,
  channel: string
) => {
  const { branches, sha } = body;
  const matchingBranch = branches.find(({ commit }) => commit.sha === sha);

  // Merges should only happen on the default branch, which can be customised.
  if (matchingBranch?.name === Branch.DEFAULT) {
    const queue = await getQueue();
    const labels = getLabels(queue);
    const mergeableItemsState = getMergeableItemsState(queue);

    const mergeableItems = mergeableItemsState.filter((item) =>
      isMergeable(item)
    );

    if (mergeableItems.length) {
      const graphqlClient = await createClient();
      const prToMerge = mergeableItems.shift();
      const { id, headRefName } = prToMerge;

      console.log(`Merging: ${prToMerge.title}`);
      const shouldMerge = process.env.MERGE_ENABLED === "true";
      shouldMerge && (await mergePR(graphqlClient, id, headRefName));
    } else if (!isPaused(labels)) {
      await client.postMergeMessage(
        mergeableItemsState,
        "No PRs left to merge.",
        channel
      );
    }
  }
};
