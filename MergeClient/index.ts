import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { App } from "@slack/bolt";
import { AzureFunctionsReceiver } from "bolt-azure-functions-receiver";
import { parseCommand } from "./command";

const slackTrigger: AzureFunction = async (
  context: Context,
  req: HttpRequest
) => {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  const receiver = new AzureFunctionsReceiver(signingSecret, context.log);
  const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret,
    receiver,
  });

  app.command("/merge", async ({ command: { text }, respond, ack }) => {
    await ack();
    await parseCommand({ text, respond });
  });

  const body = await receiver.requestHandler(req);
  context.log(body);

  context.done(null, { status: 200 });
};

const teamsTrigger: AzureFunction = async (
  context: Context,
  req: HttpRequest
) => {};

const trigger =
  process.env.CLIENT_PLATFORM === "slack" ? slackTrigger : teamsTrigger;

export default trigger;
