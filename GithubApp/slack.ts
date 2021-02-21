import { KnownBlock } from "@slack/bolt";
import { PanelData } from "./types";

export const createSlackPanel = ({
  footer,
  headline,
  pull_request,
  tag,
  changed,
}: PanelData) => {
  const blocks: KnownBlock[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${headline}:\n*<${pull_request.html_url}|${pull_request.title}>*`,
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `${changed ? "*Changed by:*" : "*Created by:*"}\n${tag}`,
        },
        {
          type: "mrkdwn",
          text: `*When:*\n${new Date(pull_request.updated_at).toLocaleString(
            "en-GB"
          )}`,
        },
      ],
    },
  ];

  footer &&
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: footer,
      },
    });

  return blocks;
};
