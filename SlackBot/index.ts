import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { App } from '@slack/bolt';
import { AzureFunctionsReceiver } from 'bolt-azure-functions-receiver';
import { parseCommand } from './command';

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  const receiver = new AzureFunctionsReceiver(signingSecret, context.log);
  const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret,
    receiver,
  });

  app.command('/merge', async ({ command, respond, ack, say }) => {
    await parseCommand({ command, context, respond, ack, say });
  });

  const body = await receiver.requestHandler(req);
  context.log(body);
};

export default httpTrigger;
