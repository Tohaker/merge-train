import { WebClient } from "@slack/web-api";
import { PullRequest } from "@octokit/webhooks-definitions/schema";
import { getQueue, getItems } from "../graphql/queue";

export const handleItemAdded = async (
  client: WebClient,
  pullRequest: PullRequest,
  channel: string
) => {
  const queue = await getQueue();

  if (getItems(queue).length > 1) {
    console.log("Queue was not empty, no new merges to perform");
    return;
  }

  if (pullRequest.mergeable) {
    // TODO: Replace with actual merge request
    await client.chat.postMessage({
      icon_emoji: ":steam_locomotive:",
      text: `I would have merged <${pullRequest.url}|${pullRequest.title}> now, is it a good time?`,
      channel,
    });
  } else {
    await client.chat.postMessage({
      icon_emoji: ":steam_locomotive:",
      text:
        "This PR cannot be merged yet, remove the label until this is resolved.",
      channel,
    });
  }
};
