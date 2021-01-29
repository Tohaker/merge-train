import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import crypto from "crypto";
import fetch from "node-fetch";

type PullRequest = {
  html_url: string;
  title: string;
  created_at: string;
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
  context.log("Body:", req.body);
  try {
    const receivedSignature = req.headers["x-hub-signature"].split("=");
    const calculatedSignature = crypto
      .createHmac(receivedSignature[0], process.env.GHAPP_SECRET)
      .update(req.body)
      .digest("hex");
    const calculatedSignatureRaw = crypto
      .createHmac(receivedSignature[0], process.env.GHAPP_SECRET)
      .update(req.rawBody)
      .digest("hex");

    context.log("received signature:", receivedSignature[1]);
    context.log("calc:", calculatedSignature);
    context.log("calcRaw:", calculatedSignatureRaw);
  } catch (e) {
    context.log(e);
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

  context.log({
    action,
    pull_request,
    label,
    sender,
  });

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
            text: `*Opened by:*\n${sender.login}`,
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

    fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: "C015KE3RXGB",
        icon_url: sender.avatar_url,
        blocks,
      }),
    });
  }
};

export default httpTrigger;
