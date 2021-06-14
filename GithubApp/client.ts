import { WebClient } from "@slack/web-api";
import fetch from "node-fetch";
import { createSlackMergePanel, createSlackReviewPanel } from "./slack";
import { createTeamsMergeCard, createTeamsReviewCard } from "./teams";
import { CardProps, SlackUser, Client } from "./types";
import { icon_emoji } from "../common/config";
import { Team, User } from "@octokit/webhooks-types";
import { MergeableItemState } from "../graphql/queue";

export const formatLink = ({ text, url }) => {
  const isSlackClient = process.env.CLIENT_PLATFORM === "slack";

  if (isSlackClient) {
    return `<${url}|${text}>`;
  } else {
    return `[${text}](${url})`;
  }
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

const postSlackReviewMessage =
  (client: WebClient) => async (cardProps: CardProps, channel: string) => {
    const slackMessage = createSlackReviewPanel(cardProps);
    await client.chat.postMessage({
      icon_emoji,
      channel,
      blocks: slackMessage,
      text: cardProps.headline,
    });
  };

const postSlackMergeMessage =
  (client: WebClient) =>
  async (states: MergeableItemState[], summary: string, channel: string) => {
    const slackMessage = createSlackMergePanel(states);
    await client.chat.postMessage({
      icon_emoji,
      channel,
      blocks: slackMessage,
      text: summary,
    });
  };

const postSlackSimpleMessage =
  (client: WebClient) => async (text: string, channel: string) => {
    await client.chat.postMessage({
      icon_emoji,
      channel,
      text,
    });
  };

const postTeamsReviewMessage = async (card: CardProps) => {
  const teamsMessage = createTeamsReviewCard(card);
  await fetch(process.env.TEAMS_INCOMING_WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(teamsMessage),
  });
};

const postTeamsMergeMessage = async (states: MergeableItemState[]) => {
  const teamsMessage = createTeamsMergeCard(states);
  await fetch(process.env.TEAMS_INCOMING_WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(teamsMessage),
  });
};

const postTeamsSimpleMessage = async (text: string) => {
  await fetch(process.env.TEAMS_INCOMING_WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
};

export const createClient = (): Client => {
  const isSlackClient = process.env.CLIENT_PLATFORM === "slack";

  if (isSlackClient) {
    const client = new WebClient(process.env.SLACK_BOT_TOKEN);
    return {
      postReviewMessage: postSlackReviewMessage(client),
      postMergeMessage: postSlackMergeMessage(client),
      postSimpleMessage: postSlackSimpleMessage(client),
      formatAssignees: formatSlackAssignees(client),
    };
  } else {
    return {
      postReviewMessage: postTeamsReviewMessage,
      postMergeMessage: postTeamsMergeMessage,
      postSimpleMessage: postTeamsSimpleMessage,
      formatAssignees: formatTeamsAssignees,
    };
  }
};
