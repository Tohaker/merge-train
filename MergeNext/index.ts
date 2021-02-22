import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { WebClient } from "@slack/web-api";
import { checkSignature } from "../common/checkSignature";
import { Conversation } from "../common/types";
import { ChannelName } from "../common/config";
import { getMergeableItems, getQueue, hasItems } from "../graphql/queue";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  if (!checkSignature(req)) {
    context.log("Hash signature doesn't match - terminating session");
    context.done(null, {
      status: 401,
      body: "Hash signature doesn't match",
    });
    return;
  }

  const slackWebClient = new WebClient(process.env.SLACK_BOT_TOKEN);
  const icon_emoji = ":steam_locomotive:";
  const channels: Record<
    string,
    string
  > = ((await slackWebClient.conversations.list()) as Conversation).channels.reduce(
    (acc, channel) => ((acc[channel.name] = channel.id), acc),
    {}
  );
  const channel = channels[ChannelName.MERGE];

  const queue = await getQueue();

  if (!hasItems(queue)) {
    slackWebClient.chat.postMessage({
      icon_emoji,
      text: "All PRs have now been merged",
      channel,
    });
    context.done();
    return;
  }

  const mergeableItems = getMergeableItems(queue);

  if (mergeableItems.length) {
    const prToMerge = mergeableItems.shift();
    // TODO: Replace with actual merge request
    slackWebClient.chat.postMessage({
      icon_emoji,
      text: `<${prToMerge.url}|${prToMerge.title}> would have been merged now. Is it a good time?`,
      channel,
    });
  } else {
    slackWebClient.chat.postMessage({
      icon_emoji,
      text:
        "No PRs are ready to be merged. Check the list and manually merge to start again.",
      channel,
    });
    context.done();
  }
};

export default httpTrigger;
