import { WebClient } from "@slack/web-api";
import fetch from "node-fetch";
import { createSlackPanel } from "./slack";
import { createTeamsCard } from "./teams";
import { CardProps } from "./types";
import { icon_emoji } from "../common/config";

type Client = {
  postMessage: (cardProps: CardProps, channel?: string) => Promise<void>;
};

const postSlackMessage =
  (client: WebClient) => async (cardProps: CardProps, channel: string) => {
    const slackMessage = createSlackPanel(cardProps);
    await client.chat.postMessage({
      icon_emoji,
      channel,
      blocks: slackMessage,
      text: cardProps.headline,
    });
  };

const postTeamsMessage = async (card: CardProps) => {
  const teamsMessage = createTeamsCard(card);
  await fetch(process.env.TEAMS_INCOMING_WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(teamsMessage),
  });
};

export const createClient = (): Client => {
  const isSlackClient = process.env.CLIENT_PLATFORM === "slack";

  if (isSlackClient) {
    const client = new WebClient(process.env.SLACK_BOT_TOKEN);
    return {
      postMessage: postSlackMessage(client),
    };
  } else {
    return { postMessage: postTeamsMessage };
  }
};
