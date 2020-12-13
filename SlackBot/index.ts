import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { App } from '@slack/bolt'
import { AzureFunctionsReceiver } from "bolt-azure-functions-receiver";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    const receiver = new AzureFunctionsReceiver(signingSecret, context.log);
    const app = new App({
        token: process.env.SLACK_BOT_TOKEN,
        signingSecret,
        receiver
    })

    app.command("/merge", async ({command, ack, say}) => {
        await ack();

        await say(`You asked me to ${command.text}`)
    })

    const body = await receiver.requestHandler(req)
    context.res = {
        // status: 200, /* Defaults to 200 */
        body
    };
};

export default httpTrigger;