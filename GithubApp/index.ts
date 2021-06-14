import { AzureFunction, Context } from "@azure/functions";
import { WebClient } from "@slack/web-api";
import {
  PullRequestEvent,
  PullRequestLabeledEvent,
  StatusEvent,
} from "@octokit/webhooks-types";
import { Request } from "./types";
import { ChannelName, Label } from "../common/config";
import { handleItemAdded, handleStateReported } from "./autoMerge";
import { checkSignature } from "../common/checkSignature";
import { Conversation } from "../common/types";
import { createClient } from "./client";

const findChannels = async () => {
  if (process.env.CLIENT_PLATFORM === "slack") {
    const slackWebClient = new WebClient(process.env.SLACK_BOT_TOKEN);

    const channels: Record<string, string> = (
      (await slackWebClient.conversations.list()) as Conversation
    ).channels.reduce(
      (acc, channel) => ((acc[channel.name] = channel.id), acc),
      {}
    );

    return channels;
  } else {
    // Slack channels won't work elsewhere, so just return a default blank key for channels
    return Object.values(ChannelName).reduce(
      (acc, key) => ((acc[key] = ""), acc),
      {}
    );
  }
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

  const client = createClient();
  const channels = await findChannels();

  context.log(JSON.stringify(req.body));

  const { sender } = req.body;
  const { action, pull_request } = req.body as PullRequestEvent;
  const { label } = req.body as PullRequestLabeledEvent;
  const { state } = req.body as StatusEvent;

  // A merge was successful, so we can try to merge the next one.
  if (state === "success") {
    handleStateReported(
      client,
      req.body as StatusEvent,
      channels[ChannelName.MERGE]
    );

    context.done();
    return;
  }

  const labelName = label?.name;

  switch (action) {
    case "labeled": {
      if (labelName === Label.READY_FOR_MERGE) {
        const channel = channels[ChannelName.MERGE];
        const headline = "A new PR is ready to merge";

        await client.postReviewMessage(
          {
            headline,
            pullRequest: pull_request,
            changed: true,
            creator: await client.formatAssignees([sender])[0],
          },
          channel
        );

        await handleItemAdded(client, pull_request, channel);
      }
      break;
    }
    case "unlabeled": {
      if (labelName === Label.READY_FOR_MERGE) {
        const channel = channels[ChannelName.MERGE];
        const headline = "A PR has had its status changed";

        await client.postReviewMessage(
          {
            headline,
            pullRequest: pull_request,
            changed: true,
            creator: await client.formatAssignees([sender])[0],
          },
          channel
        );
      }
      break;
    }
    case "ready_for_review":
    case "review_requested": {
      // This prevents duplicates of the same review posts
      if ("requested_team" in req.body && !pull_request.draft) {
        const channel = channels[ChannelName.REVIEWS];
        const headline = "A PR has been marked for review";
        const assigned = await client.formatAssignees(
          pull_request.requested_reviewers
        );
        const creator = await client.formatAssignees([sender])[0];

        await client.postReviewMessage(
          {
            headline,
            pullRequest: pull_request,
            changed: true,
            assigned,
            creator,
          },
          channel
        );
      }
      break;
    }
    default:
      break;
  }
};

export default httpTrigger;
