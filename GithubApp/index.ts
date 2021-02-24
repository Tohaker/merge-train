import { AzureFunction, Context } from "@azure/functions";
import { WebClient } from "@slack/web-api";
import {
  PullRequestLabeledEvent,
  Team,
  User,
} from "@octokit/webhooks-definitions/schema";
import dotenv from "dotenv";
import { createSlackPanel } from "./slack";
import { Request, SlackUser } from "./types";
import { ChannelName } from "../common/config";
import { handleItemAdded } from "./autoMerge";
import { checkSignature } from "../common/checkSignature";
import { Conversation } from "../common/types";

dotenv.config();

const createAssignmentText = async (
  client: WebClient,
  reviewers: (User | Team)[]
) => {
  const { members } = await client.users.list();

  return reviewers
    .reduce((acc, user) => {
      // This gets us out of the User | Team union
      if ("login" in user) {
        const slackUser = (members as SlackUser[]).find(
          (slackUser) => slackUser.profile.title === user.login
        );
        if (slackUser?.id) {
          return acc + `<@${slackUser.id}> `;
        } else {
          return acc + `${user.login} `;
        }
      }
    }, "")
    .trim();
};

const httpTrigger: AzureFunction = async (
  context: Context,
  req: Request
): Promise<void> => {
  if (!checkSignature(req)) {
    context.log("Hash signature doesn't match - terminating session");
    context.done(null, {
      status: 401,
      body: "Hash signature doesn't match",
    });
    return;
  }

  const slackWebClient = new WebClient(process.env.SLACK_BOT_TOKEN);
  const icon_emoji = ":steam_locomotive:";
  const channels: Record<
    string,
    string
  > = ((await slackWebClient.conversations.list()) as Conversation).channels.reduce(
    (acc, channel) => ((acc[channel.name] = channel.id), acc),
    {}
  );
  const { action, pull_request, sender } = req.body;
  const label = (req.body as PullRequestLabeledEvent).label;

  const labelName = label?.name.toLowerCase();
  const readyForMergeLabel = "ready for merge";

  switch (action) {
    case "labeled": {
      if (labelName.includes(readyForMergeLabel)) {
        const channel = channels[ChannelName.MERGE];
        const headline = "A new PR is ready to merge";

        const blocks = createSlackPanel({
          headline,
          pull_request,
          tag: await createAssignmentText(slackWebClient, [sender]),
          changed: true,
        });

        await slackWebClient.chat.postMessage({
          icon_emoji,
          blocks,
          channel,
          text: headline,
        });
        await handleItemAdded(slackWebClient, pull_request, channel);
      }
      break;
    }
    case "unlabeled": {
      if (labelName.includes(readyForMergeLabel)) {
        const channel = channels[ChannelName.MERGE];
        const headline = "A PR has had its status changed";

        const blocks = createSlackPanel({
          headline,
          pull_request,
          tag: await createAssignmentText(slackWebClient, [sender]),
          changed: true,
        });

        await slackWebClient.chat.postMessage({
          icon_emoji,
          blocks,
          channel,
          text: headline,
        });
      }
      break;
    }
    case "review_requested": {
      // This prevents duplicates of the same review posts
      if ("requested_team" in req.body) {
        const channel = channels[ChannelName.REVIEWS];
        const headline = "A PR has been marked for review";
        const reviewers = await createAssignmentText(
          slackWebClient,
          pull_request.requested_reviewers
        );
        const blocks = createSlackPanel({
          headline,
          footer: `The following people have been assigned: ${reviewers}`,
          pull_request,
          tag: await createAssignmentText(slackWebClient, [sender]),
        });

        await slackWebClient.chat.postMessage({
          icon_emoji,
          blocks,
          channel,
          text: headline,
        });
      }
      break;
    }
    default:
      context.log(JSON.stringify(req.body))
      break;
  }
};

export default httpTrigger;
