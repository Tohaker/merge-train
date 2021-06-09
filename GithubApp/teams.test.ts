import { PullRequest } from "@octokit/webhooks-types";
import { createTeamsCard } from "./teams";

describe("Create teams card", () => {
  beforeEach(() => {
    process.env.GITHUB_REPOSITORY = "repo";
  });

  it("should create the correct card", () => {
    const mockPullRequest = {
      html_url: "http://some.url",
      title: "PR title",
      updated_at: "2021-01-29T20:00:00Z",
      user: {
        name: "gh_user",
        id: "1234",
      },
      requested_reviewers: [
        {
          id: "1235",
        },
        {
          id: "1236",
        },
      ],
    } as unknown as PullRequest;

    const result = createTeamsCard({
      headline: "headline",
      pullRequest: mockPullRequest,
      assigned: ["1235", "1236"],
    });

    expect(result).toMatchObject({
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      themeColor: "0076D7",
      summary: "headline",
      sections: [
        {
          activityTitle: "headline",
          activitySubtitle: `In repo`,
          activityImage:
            "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/mozilla/36/steam-locomotive_1f682.png",
          facts: [
            {
              name: "Creator",
              value: "gh_user",
            },
            {
              name: "Assigned to",
              value: "1235, 1236",
            },
            {
              name: "When",
              value: "1/29/2021, 8:00:00 PM",
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
              uri: "http://some.url",
            },
          ],
        },
      ],
    });
  });
});
