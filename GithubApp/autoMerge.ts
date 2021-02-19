import { getQueue, hasItems } from "./queue";
import { postMessage } from "./slackApi";
import { PullRequest } from "./types";

export const handleItemAdded = async (
  pullRequest: PullRequest,
  channel: string
) => {
  const queue = await getQueue();

  if (hasItems(queue)) {
    console.log("Queue not empty, no new merges to perform");
    return;
  }

  if (pullRequest.mergeable) {
    // TODO: Replace with actual merge request
    await postMessage(
      [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "I would have merged something now, is it a good time?",
          },
        },
      ],
      channel
    );
  } else {
    await postMessage(
      [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text:
              "This PR cannot be merged yet, remove the label until this is resolved.",
          },
        },
      ],
      channel
    );
  }
};
