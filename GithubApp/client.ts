import { WebClient, ChatPostMessageArguments } from "@slack/web-api";
import fetch from "node-fetch";

type Client = {
  postMessage: (args: any) => Promise<any>;
};

type TeamsMessage = {
  summary: string;
  assignees: string;
  modified: Date;
  uri: string;
};

const postSlackMessage =
  (client: WebClient) => (args: ChatPostMessageArguments) =>
    client.chat.postMessage(args);

const createTeamsCard = ({
  summary,
  assignees,
  modified,
  uri,
}: TeamsMessage) => ({
  "@type": "MessageCard",
  "@context": "http://schema.org/extensions",
  themeColor: "0076D7",
  summary,
  sections: [
    {
      activityTitle: summary,
      activitySubtitle: `In ${process.env.GITHUB_REPOSITORY}`,
      activityImage:
        "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/mozilla/36/steam-locomotive_1f682.png",
      facts: [
        {
          name: "Assigned to",
          value: assignees,
        },
        {
          name: "When",
          value: modified.toLocaleString("en-GB"),
        },
      ],
      markdown: true,
    },
  ],
  potentialAction: [
    {
      "@type": "OpenUri",
      name: "View this PR",
      targets: [
        {
          os: "default",
          uri,
        },
      ],
    },
  ],
});

const postTeamsMessage = (args: TeamsMessage) =>
  fetch(process.env.TEAMS_INCOMING_WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(createTeamsCard(args)),
  });

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
