import { WebClient, ChatPostMessageArguments } from "@slack/web-api";
import fetch from "node-fetch";
import { TeamsMessage } from "./teams";

type Client = {
  postMessage: (args: TeamsMessage | ChatPostMessageArguments) => Promise<void>;
};

const postSlackMessage =
  (client: WebClient) => async (args: ChatPostMessageArguments) => {
    await client.chat.postMessage(args);
  };

const postTeamsMessage = async (card: TeamsMessage) => {
  await fetch(process.env.TEAMS_INCOMING_WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(card),
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
