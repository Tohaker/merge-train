type TeamsCardProps = {
  summary: string;
  assigned: string;
  modified: Date;
  uri: string;
};

export type TeamsMessage = ReturnType<
  typeof createTeamsReviewCard | typeof createTeamsMergeCard
>;

export const createTeamsReviewCard = ({
  summary,
  assigned,
  modified,
  uri,
}: TeamsCardProps) => ({
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
          value: assigned,
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

export const createTeamsMergeCard = ({
  summary,
  assigned,
  modified,
  uri,
}: TeamsCardProps) => ({
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
          name: "Changed by",
          value: assigned,
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
