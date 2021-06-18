import { PullRequest } from "@octokit/webhooks-types";
import { createTeamsReviewCard, createTeamsMergeCard } from "./teams";

describe("Create Teams Review card", () => {
  beforeEach(() => {
    process.env.GITHUB_REPOSITORY = "repo";
    process.env.CLIENT_PLATFORM = "teams";
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

    const result = createTeamsReviewCard({
      headline: "headline",
      pullRequest: mockPullRequest,
      assigned: ["1235", "1236"],
      creator: "creator",
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
              value: "creator",
            },
            {
              name: "Assigned to",
              value: "1235, 1236",
            },
            {
              name: "When",
              value: "29/01/2021, 20:00:00",
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

  describe("given no assignees are provided", () => {
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

      const result = createTeamsReviewCard({
        headline: "headline",
        pullRequest: mockPullRequest,
        creator: "creator",
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
                value: "creator",
              },
              {
                name: "When",
                value: "29/01/2021, 20:00:00",
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
});

describe("Create Teams Merge card", () => {
  beforeEach(() => {
    process.env.CLIENT_PLATFORM = "teams";
  });

  describe("given no states are provided", () => {
    it("should return a simple text body", () => {
      const result = createTeamsMergeCard([]);

      expect(result).toMatchObject({
        text: "No Pull Requests are ready to merge",
      });
    });
  });

  describe("given states list is not empty", () => {
    it("should output all sections", () => {
      const mockStates = [
        {
          title: "pr1",
          url: "http://some1.url",
          mergeable: true,
          headCommitState: "SUCCESS",
          appliedLabels: ["ready to merge"],
        },
        {
          title: "pr2",
          url: "http://some2.url",
          mergeable: false,
          headCommitState: "FAILURE",
          appliedLabels: ["ready to merge", "merge train paused"],
        },
      ];

      //@ts-ignore
      const result = createTeamsMergeCard(mockStates);

      expect(result).toMatchObject({
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        themeColor: "0076D7",
        summary: "No Pull Requests are ready to merge",
        sections: [
          {
            activityTitle: "No Pull Requests are ready to merge",
            activitySubtitle: "Review their statuses below",
            activityImage:
              "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/mozilla/36/steam-locomotive_1f682.png",
          },
          {
            title: "[pr1](http://some1.url)",
            facts: [
              {
                name: "Mergeable",
                value: true,
              },
              {
                name: "Head Commit State",
                value: "SUCCESS",
              },
              {
                name: "Labels",
                value: "`ready to merge`",
              },
            ],
          },
          {
            title: "[pr2](http://some2.url)",
            facts: [
              {
                name: "Mergeable",
                value: false,
              },
              {
                name: "Head Commit State",
                value: "FAILURE",
              },
              {
                name: "Labels",
                value: "`ready to merge`, `merge train paused`",
              },
            ],
          },
        ],
      });
    });
  });
});
