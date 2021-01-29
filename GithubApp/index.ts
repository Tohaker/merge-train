import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import crypto from "crypto";
import fetch from "node-fetch";
import {
  connectToCosmos,
  createItem,
  deleteItem,
  readAllItems,
} from "../common/cosmos";

type PullRequest = {
  html_url: string;
  title: string;
  created_at: string;
  updated_at: string;
};

type Label = {
  name: string;
};

type Sender = {
  login: string;
  avatar_url: string;
};

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const receivedSignature = req.headers["x-hub-signature"].split("=");
  const calculatedSignatureRaw = crypto
    .createHmac(receivedSignature[0], process.env.GHAPP_SECRET)
    .update(req.rawBody)
    .digest("hex");

  if (calculatedSignatureRaw !== receivedSignature[1]) {
    context.log("Hash signature doesn't match - terminating session");
    return;
  }

  const {
    action,
    pull_request,
    label,
    sender,
  }: {
    action: string;
    pull_request: PullRequest;
    label: Label;
    sender: Sender;
  } = req.body;

  if (label.name.toLowerCase().includes("merge")) {
    if (action === "labeled") {
      const blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `A new PR is ready to merge:\n*<${pull_request.html_url}|${pull_request.title}>*`,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Changed by:*\n${sender.login}`,
            },
            {
              type: "mrkdwn",
              text: `*When:*\n${new Date(
                pull_request.created_at
              ).toDateString()}`,
            },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "This has now been added to the list :page_with_curl:",
          },
        },
      ];

      const container = connectToCosmos();
      const items = await readAllItems(container);

      if (items.some(({ url }) => url === pull_request.html_url)) {
        context.log(`PR (${pull_request.html_url}) already saved`);
        return;
      } else {
        try {
          await createItem(container, pull_request.html_url);

          await fetch("https://slack.com/api/chat.postMessage", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              channel: "C015KE3RXGB",
              icon_emoji: ":steam_locomotive:",
              blocks,
            }),
          });
        } catch (e) {
          context.log("Error creating item: ", e);
        }
      }
    } else if (action === "unlabled") {
      const blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `A PR has had its status changed:\n*<${pull_request.html_url}|${pull_request.title}>*`,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Changed by:*\n${sender.login}`,
            },
            {
              type: "mrkdwn",
              text: `*When:*\n${new Date(
                pull_request.updated_at
              ).toDateString()}`,
            },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "This has now been removed to the list :page_with_curl:",
          },
        },
      ];

      const container = connectToCosmos();
      const items = await readAllItems(container);

      try {
        const id = items.find(({ url }) => url === pull_request.html_url)?.id;
        if (id) {
          await deleteItem(container, id);

          await fetch("https://slack.com/api/chat.postMessage", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              channel: "C015KE3RXGB",
              icon_emoji: ":steam_locomotive:",
              blocks,
            }),
          });
        } else {
          context.log("No ID found for this url");
        }
      } catch (e) {
        context.log("Error creating item: ", e);
      }
    }
  }
};

export default httpTrigger;
