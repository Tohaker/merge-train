import { KnownBlock } from "@slack/bolt";
import { MergeableItemState } from "../graphql/queue";
import { formatLink } from "./client";
import { CardProps } from "./types";

export const createSlackReviewPanel = ({
  headline,
  pullRequest,
  creator,
  changed,
  assigned,
}: CardProps) => {
  const blocks: KnownBlock[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${headline}:\n*${formatLink({
          text: pullRequest.title,
          url: pullRequest.html_url,
        })}*`,
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `${changed ? "*Changed by:*" : "*Created by:*"}\n${creator}`,
        },
        {
          type: "mrkdwn",
          text: `*When:*\n${new Date(pullRequest.updated_at).toLocaleString(
            "en-GB"
          )}`,
        },
      ],
    },
  ];

  assigned &&
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `The following people have been assigned: ${assigned.join(", ")}`,
      },
    });

  return blocks;
};

export const createSlackMergePanel = (states: MergeableItemState[]) => {
  let text = "*No Pull Requests are ready to merge*";
  if (states.length) text += "\nReview their statuses below";

  const blocks: KnownBlock[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text,
      },
    },
  ];

  if (states.length)
    blocks.push({
      type: "divider",
    });
  else return blocks;

  const sections = states.reduce((acc, state) => {
    const link = formatLink({
      text: state.title,
      url: state.url,
    });
    const element = `Mergeable: \`${state.mergeable}\`\nHead Commit State: \`${
      state.headCommitState
    }\`\nLabels: ${state.appliedLabels.map((l) => `\`${l}\``).join(", ")}`;

    const section = {
      type: "section",
      text: {
        type: "mrkdwn",
        text: link,
      },
    };

    const context = {
      type: "context",
      elements: [{ type: "mrkdwn", text: element }],
    };

    return acc.concat(section, context);
  }, []);

  blocks.push(...sections, { type: "divider" });

  return blocks;
};
