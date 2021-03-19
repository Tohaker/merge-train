import { Context } from "@azure/functions";
import { WebClient } from "@slack/web-api";
import { PullRequest, StatusEvent } from "@octokit/webhooks-definitions/schema";
import { Label as PullRequestLabel, Commit } from "@octokit/graphql-schema";
import {
  getQueue,
  getItems,
  getMergeableItemsState,
  isMergeable,
  MergeableItemState,
} from "../graphql/queue";
import { Branch, icon_emoji, Label } from "../common/config";
import {
  addLabelToPullRequest,
  getCommitStatus,
  createClient,
  Queue,
} from "../graphql";

const getLabels = (queue: Queue): PullRequestLabel[] =>
  queue.repository.pullRequests.nodes?.reduce(
    (acc, pr) => acc.concat(pr.labels?.nodes),
    []
  );

const isPaused = (labels: PullRequestLabel[]) =>
  labels?.some((label) => label.name === Label.MERGE_TRAIN_PAUSED);

export const handleItemAdded = async (
  client: WebClient,
  pullRequest: PullRequest,
  channel: string,
  context: Context
) => {
  const queue = await getQueue();
  const graphqlClient = await createClient();

  if (getItems(queue).length > 1) {
    context.log("Queue was not empty, no new merges to perform");

    const labels = getLabels(queue);
    if (isPaused(labels)) {
      context.log("Pausing this PR");

      await graphqlClient(addLabelToPullRequest, {
        labelId: labels.find(({ name }) => name === Label.MERGE_TRAIN_PAUSED)
          .id,
        pullRequestId: pullRequest.node_id,
      });
    }

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
      // TODO: Replace with actual merge request
      await client.chat.postMessage({
        icon_emoji,
        text: `<${pullRequest.html_url}|${pullRequest.title}> would have been merged now, is it a good time?`,
        channel,
      });
    } else {
      await client.chat.postMessage({
        icon_emoji,
        text: `<${pullRequest.html_url}|${pullRequest.title}> cannot be merged yet, remove the label until this is resolved.`,
        channel,
      });
    }
  }
};

const createBlocks = (states: MergeableItemState[]) => {
  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "*No Pull Requests are ready to merge*\nReview their statuses below",
      },
    },
    {
      type: "divider",
    },
  ];

  const sections = states.reduce((acc, state) => {
    const link = `<${state.url}|${state.title}>`;
    const element = `Mergeable: \`${state.mergeable}\`\nHead Commit State: \`${
      state.headCommitState
    }\`\nLabels: ${state.appliedLabels.map((l) => `\`${l}\``).join(", ")}`;

    const section = {
      type: "section",
      text: {
        type: "mrkdwn",
        text: link,
      },
    };

    const context = {
      type: "context",
      elements: [{ type: "mrkdown", text: element }],
    };

    return acc.concat(section, context);
  }, []);

  blocks.push(...sections, { type: "divider" });

  return blocks;
};

export const handleStateReported = async (
  client: WebClient,
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
      const prToMerge = mergeableItems.shift();
      // TODO: Replace with actual merge request
      await client.chat.postMessage({
        icon_emoji,
        text: `<${prToMerge.url}|${prToMerge.title}> would have been merged now. Is it a good time?`,
        channel,
      });
    } else if (!isPaused(labels)) {
      await client.chat.postMessage({
        icon_emoji,
        blocks: createBlocks(mergeableItemsState),
        text: "No PRs left to merge.",
        channel,
      });
    }
  }
};
