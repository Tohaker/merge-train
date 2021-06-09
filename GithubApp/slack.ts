import { KnownBlock } from "@slack/bolt";
import { CardProps } from "./types";

export const createSlackPanel = ({
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
        text: `${headline}:\n*<${pullRequest.html_url}|${pullRequest.title}>*`,
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
        text: `The following people have been assigned: ${assigned.join(" ")}`,
      },
    });

  return blocks;
};
