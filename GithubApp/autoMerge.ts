import { getMergeableItems, getQueue, hasItems } from "./queue";
import { postMessage } from "./slackApi";

export const handleItemAdded = async (channel: string) => {
  const queue = await getQueue();

  if (!hasItems(queue)) {
    console.log("Queue not empty, no new merges to perform");
    return;
  }

  const mergeableItems = getMergeableItems(queue);

  if (mergeableItems.length) {
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
              "None of the PRs in the queue can be merged, remove the label until this is resolved.",
          },
        },
      ],
      channel
    );
  }
};
