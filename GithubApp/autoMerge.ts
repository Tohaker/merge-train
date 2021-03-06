import { Context } from "@azure/functions";
import { WebClient } from "@slack/web-api";
import { PullRequest, StatusEvent } from "@octokit/webhooks-definitions/schema";
import { Label as PullRequestLabel } from "@octokit/graphql-schema";
import { getQueue, getItems, getMergeableItems } from "../graphql/queue";
import { Branch, icon_emoji, Label } from "../common/config";
import { addLabelToPullRequest, createClient } from "../graphql";

export const handleItemAdded = async (
  client: WebClient,
  pullRequest: PullRequest,
  channel: string,
  context: Context
) => {
  const queue = await getQueue();

  if (getItems(queue).length > 1) {
    context.log("Queue was not empty, no new merges to perform");

    const labels: PullRequestLabel[] = queue.repository.pullRequests.nodes?.reduce(
      (acc, pr) => acc.concat(pr.labels?.nodes),
      []
    );
    if (labels?.some((label) => label.name === Label.MERGE_TRAIN_PAUSED)) {
      context.log("Pausing this PR");
      const client = await createClient();

      await client(addLabelToPullRequest, {
        labelId: labels.find(({ name }) => name === Label.MERGE_TRAIN_PAUSED)
          .id,
        pullRequestId: pullRequest.node_id,
      });
    }

    return;
  }

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
      text:
        "This PR cannot be merged yet, remove the label until this is resolved.",
      channel,
    });
  }
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
    const mergeableItems = getMergeableItems(queue);

    if (mergeableItems.length) {
      const prToMerge = mergeableItems.shift();
      // TODO: Replace with actual merge request
      await client.chat.postMessage({
        icon_emoji,
        text: `<${prToMerge.url}|${prToMerge.title}> would have been merged now. Is it a good time?`,
        channel,
      });
    } else {
      await client.chat.postMessage({
        icon_emoji,
        text:
          "The merge train has pulled into the station; no PRs left to merge. All aboard!",
        channel,
      });
    }
  }
};
