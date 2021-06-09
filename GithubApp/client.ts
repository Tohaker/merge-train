import { WebClient } from "@slack/web-api";
import fetch from "node-fetch";
import { createSlackPanel } from "./slack";
import { createTeamsCard } from "./teams";
import { CardProps, SlackUser } from "./types";
import { icon_emoji } from "../common/config";
import { Team, User } from "@octokit/webhooks-types";

type Client = {
  postMessage: (cardProps: CardProps, channel?: string) => Promise<void>;
  formatAssignees: (reviewers: (User | Team)[]) => Promise<string[]>;
};

const formatSlackAssignees =
  (client: WebClient) => async (reviewers: (User | Team)[]) => {
    const { members } = await client.users.list();

    return reviewers.map((user) => {
      // This gets us out of the User | Team union
      if ("login" in user) {
        const slackUser = (members as SlackUser[]).find(
          (slackUser) => slackUser.profile.title === user.login
        );
        if (slackUser?.id) {
          return `<@${slackUser.id}>`;
        } else {
          return user.login;
        }
      }
    });
  };

const formatTeamsAssignees = (reviewers: (User | Team)[]) => {
  return Promise.resolve(
    reviewers.map((user) => ("name" in user ? user.name : user.id.toString()))
  );
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
      formatAssignees: formatSlackAssignees(client),
    };
  } else {
    return {
      postMessage: postTeamsMessage,
      formatAssignees: formatTeamsAssignees,
    };
  }
};
