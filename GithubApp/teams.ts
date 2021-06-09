import { CardProps } from "./types";

export type TeamsMessage = ReturnType<typeof createTeamsCard>;

export const createTeamsCard = ({ headline, pullRequest }: CardProps) => ({
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
          value: pullRequest.user.name,
        },
        {
          name: "Assigned to",
          value: pullRequest.requested_reviewers
            .map((user) => ("name" in user ? user.name : user.id))
            .join(", "),
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
