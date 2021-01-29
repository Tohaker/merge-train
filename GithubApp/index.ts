import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { App } from "@slack/bolt";
import fetch from "node-fetch";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log("Headers:", req.headers);
  context.log("Body:", req.body);

  await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel: "C015KE3RXGB",
      icon_emoji: ":steam_locomotive:",
      text: "I have been sent from GitHub, be not afraid.",
    }),
  });

  const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
  });

  context.log(app.client.conversations.list());

  // const channelName = "merge";
  // // const channelId = await app.client.conversations
  // //   .list()
  // //   .then((res) => res.channels)
  // //   .then(
  // //     (channels: [{ id: string; name: string }]) =>
  // //       channels.find(({ name }) => name === channelName).id
  // //   );

  // app.client.chat.postMessage({
  //   channel: "C015KE3RXGB",
  //   icon_emoji: ":steam_locomotive:",
  //   text: "I have been sent from GitHub, be not afraid.",
  // });
};

export default httpTrigger;
