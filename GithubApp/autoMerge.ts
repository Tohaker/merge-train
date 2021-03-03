import { Context } from "@azure/functions";
import { WebClient } from "@slack/web-api";
import { PullRequest, StatusEvent } from "@octokit/webhooks-definitions/schema";
import { getQueue, getItems, getMergeableItems } from "../graphql/queue";
import { Branch, icon_emoji } from "../common/config";

export const handleItemAdded = async (
  client: WebClient,
  pullRequest: PullRequest,
  channel: string,
  context: Context
) => {
  const queue = await getQueue();

  if (getItems(queue).length > 1) {
    context.log("Queue was not empty, no new merges to perform");
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
  channel: string,
  context: Context
) => {
  const { branches, sha } = body;
  const matchingBranch = branches.find(({ commit }) => commit.sha === sha);

  // Merges should only happen on the default branch, which can be customised.
  if (matchingBranch?.name === Branch.DEFAULT) {
    const queue = await getQueue();
    const mergeableItems = getMergeableItems(queue, context);

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
