import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { App } from "@slack/bolt";
import { AzureFunctionsReceiver } from "bolt-azure-functions-receiver";
import { isMessageAuthorized } from "./auth";
import { parseCommand } from "./command";
import { icon_emoji } from "../common/config";

export const slackTrigger: AzureFunction = async (
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

    const sendMessage = (text: string, ephemeral = false) =>
      ephemeral
        ? respond({ icon_emoji, response_type: "ephemeral", text })
        : respond({
            icon_emoji,
            response_type: "in_channel",
            text,
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text,
                },
              },
            ],
          });

    const command = text.split(" ")[0].toLowerCase();
    await parseCommand({ command, respond: sendMessage });
  });

  const body = await receiver.requestHandler(req);
  context.log(body);

  context.done(null, { status: 200 });
};

const extractCommand = (text: string) => text.split("</at>")[1].trim();

export const teamsTrigger: AzureFunction = async (
  context: Context,
  req: HttpRequest
) => {
  const isAuthorized = isMessageAuthorized(req);
  if (!isAuthorized) {
    return (context.res = {
      status: 401,
    });
  }

  const command = extractCommand(req.body.text);

  const respond = async (text: string) => {
    context.res = {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        type: "message",
        text,
      },
    };
  };

  await parseCommand({ command, respond });
};

export const run =
  process.env.CLIENT_PLATFORM === "slack" ? slackTrigger : teamsTrigger;
