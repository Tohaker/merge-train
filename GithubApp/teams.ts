import { MergeableItemState } from "../graphql/queue";
import { formatLink } from "./client";
import { CardProps } from "./types";

export type TeamsMessage = ReturnType<typeof createTeamsReviewCard>;

export const createTeamsReviewCard = ({
  headline,
  pullRequest,
  assigned,
  creator,
}: CardProps) => ({
  "@type": "MessageCard",
  "@context": "http://schema.org/extensions",
  themeColor: "0076D7",
  summary: headline,
  sections: [
    {
      activityTitle: headline,
      activitySubtitle: `In ${process.env.GITHUB_REPOSITORY}`,
      activityImage:
        "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/mozilla/36/steam-locomotive_1f682.png",
      facts: [
        {
          name: "Creator",
          value: creator,
        },
        {
          name: "Assigned to",
          value: assigned.join(", "),
        },
        {
          name: "When",
          value: new Date(pullRequest.updated_at).toLocaleString("en-GB"),
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
          uri: pullRequest.html_url,
        },
      ],
    },
  ],
});

export const createTeamsMergeCard = (states: MergeableItemState[]) => {
  const text = "No Pull Requests are ready to merge";
  const subtitle = "Review their statuses below";

  if (!states.length) {
    return { text };
  }

  const sections = states.map((state) => {
    const link = formatLink({
      text: state.title,
      url: state.url,
    });

    return {
      title: link,
      facts: [
        {
          name: "Mergeable",
          value: state.mergeable,
        },
        {
          name: "Head Commit State",
          value: state.headCommitState,
        },
        {
          name: "Labels",
          value: state.appliedLabels.map((l) => `\`${l}\``).join(", "),
        },
      ],
    };
  }, []);

  return {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    themeColor: "0076D7",
    summary: text,
    sections: [
      {
        activityTitle: text,
        activitySubtitle: subtitle,
        activityImage:
          "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/mozilla/36/steam-locomotive_1f682.png",
      },
      ...sections,
    ],
  };
};
