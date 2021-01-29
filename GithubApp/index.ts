import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { App } from "@slack/bolt";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log("Headers:", req.headers);
  context.log("Body:", req.body);

  const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
  });

  app.client.chat.postMessage({
    channel: "merge",
    icon_emoji: ":steam_locomotive:",
    text: "I have been sent from GitHub, be not afraid.",
  });
};

export default httpTrigger;
