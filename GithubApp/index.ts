import { AzureFunction, Context } from "@azure/functions";
import {
  PullRequestLabeledEvent,
  Team,
  User,
} from "@octokit/webhooks-definitions/schema";
import { checkSignature } from "./checkSignature";
import {
  postMessage,
  createSlackPanel,
  listConversations,
  listUsers,
} from "./slackApi";
import { Request } from "./types";
import { ChannelName } from "./config";
import { handleItemAdded } from "./autoMerge";

const createAssignmentText = async (reviewers: (User | Team)[]) => {
  const { members } = await listUsers();

  return reviewers
    .reduce((acc, user) => {
      // This gets us out of the User | Team union
      if ("login" in user) {
        const slackUser = members.find(
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
    return;
  }

  const channels: Record<string, string> = (
    await listConversations()
  ).channels.reduce(
    (acc, channel) => ((acc[channel.name] = channel.id), acc),
    {}
  );
  const { action, pull_request, sender } = req.body;
  const label = (req.body as PullRequestLabeledEvent).label;

  context.log({
    action,
    pull_request,
    label,
    sender,
  });

  const labelName = label?.name.toLowerCase();

  const readyForMergeLabel = "ready for merge";

  switch (action) {
    case "labeled": {
      if (labelName.includes(readyForMergeLabel)) {
        const channel = channels[ChannelName.MERGE];

        const blocks = createSlackPanel({
          headline: "A new PR is ready to merge",
          pull_request,
          tag: await createAssignmentText([sender]),
          changed: true,
        });

        await postMessage(blocks, channel);
        await handleItemAdded(pull_request, channel);
      }
      break;
    }
    case "unlabeled": {
      if (labelName.includes(readyForMergeLabel)) {
        const channel = channels[ChannelName.MERGE];

        const blocks = createSlackPanel({
          headline: "A PR has had its status changed",
          pull_request,
          tag: await createAssignmentText([sender]),
          changed: true,
        });

        await postMessage(blocks, channel);
      }
      break;
    }
    case "review_requested": {
      // This prevents duplicates of the same review posts
      if (req.body.hasOwnProperty("requested_team")) {
        const channel = channels[ChannelName.REVIEWS];
        const reviewers = await createAssignmentText(
          pull_request.requested_reviewers
        );
        const blocks = createSlackPanel({
          headline: "A PR has been marked for review",
          footer: `The following people have been assigned: ${reviewers}`,
          pull_request,
          tag: await createAssignmentText([sender]),
        });

        await postMessage(blocks, channel);
      }
      break;
    }
    default:
      break;
  }
};

export default httpTrigger;
