import fetch from "node-fetch";
import { KnownBlock } from "@slack/bolt";
import { Conversation, PanelData, SlackUserList } from "./types";

export const postMessage = (blocks: KnownBlock[], channel: string) =>
  fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      icon_emoji: ":steam_locomotive:",
      channel,
      blocks,
    }),
  });

export const listConversations = () =>
  fetch("https://slack.com/api/conversations.list", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  })
    .then((response) => response.json())
    .then((data: Conversation) => data);

export const listUsers = () =>
  fetch("https://slack.com/api/users.list", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  })
    .then((response) => response.json())
    .then((data: SlackUserList) => data);

export const createSlackPanel = ({
  footer,
  headline,
  pull_request,
  tag,
  changed,
}: PanelData) => {
  const blocks: KnownBlock[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${headline}:\n*<${pull_request.html_url}|${pull_request.title}>*`,
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `${changed ? "*Changed by:*" : "*Created by:*"}\n${tag}`,
        },
        {
          type: "mrkdwn",
          text: `*When:*\n${new Date(pull_request.updated_at).toLocaleString(
            "en-GB"
          )}`,
        },
      ],
    },
  ];

  footer &&
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: footer,
      },
    });

  return blocks;
};
