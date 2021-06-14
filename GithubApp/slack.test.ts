import { PullRequest } from "@octokit/webhooks-types";
import { createSlackReviewPanel, createSlackMergePanel } from "./slack";

describe("Create Slack Review Panel", () => {
  const mockPullRequest = {
    html_url: "http://some.url",
    title: "PR title",
    updated_at: "2021-01-29T20:00:00Z",
  } as unknown as PullRequest;

  beforeEach(() => {
    process.env.CLIENT_PLATFORM = "slack";
  });

  describe("given no assigned line is provided", () => {
    describe("given the action is not a change", () => {
      it("should generate the correct blocks", () => {
        const result = createSlackReviewPanel({
          headline: "headline",
          pullRequest: mockPullRequest,
          creator: "me",
        });

        expect(result).toMatchObject([
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "headline:\n*<http://some.url|PR title>*",
            },
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: "*Created by:*\nme",
              },
              {
                type: "mrkdwn",
                text: "*When:*\n29/01/2021, 20:00:00",
              },
            ],
          },
        ]);
      });
    });

    describe("given the action is a change", () => {
      it("should generate the correct blocks", () => {
        const result = createSlackReviewPanel({
          headline: "headline",
          pullRequest: mockPullRequest,
          creator: "me",
          changed: true,
        });

        expect(result).toMatchObject([
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "headline:\n*<http://some.url|PR title>*",
            },
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: "*Changed by:*\nme",
              },
              {
                type: "mrkdwn",
                text: "*When:*\n29/01/2021, 20:00:00",
              },
            ],
          },
        ]);
      });
    });
  });

  describe("given an assigned line is provided", () => {
    describe("given the action is not a change", () => {
      it("should generate the correct blocks", () => {
        const result = createSlackReviewPanel({
          headline: "headline",
          pullRequest: mockPullRequest,
          creator: "me",
          assigned: ["someone", "else"],
        });

        expect(result).toMatchObject([
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "headline:\n*<http://some.url|PR title>*",
            },
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: "*Created by:*\nme",
              },
              {
                type: "mrkdwn",
                text: "*When:*\n29/01/2021, 20:00:00",
              },
            ],
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "The following people have been assigned: someone, else",
            },
          },
        ]);
      });
    });

    describe("given the action is a change", () => {
      it("should generate the correct blocks", () => {
        const result = createSlackReviewPanel({
          headline: "headline",
          pullRequest: mockPullRequest,
          creator: "me",
          changed: true,
          assigned: ["someone", "else"],
        });

        expect(result).toMatchObject([
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "headline:\n*<http://some.url|PR title>*",
            },
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: "*Changed by:*\nme",
              },
              {
                type: "mrkdwn",
                text: "*When:*\n29/01/2021, 20:00:00",
              },
            ],
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "The following people have been assigned: someone, else",
            },
          },
        ]);
      });
    });
  });
});

describe("Create Slack Merge Panel", () => {
  beforeEach(() => {
    process.env.CLIENT_PLATFORM = "slack";
  });

  describe("given states list is empty", () => {
    it("should output a single block", () => {
      const panel = createSlackMergePanel([]);

      expect(panel).toMatchObject([
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*No Pull Requests are ready to merge*",
          },
        },
      ]);
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
      const panel = createSlackMergePanel(mockStates);

      expect(panel).toMatchObject([
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*No Pull Requests are ready to merge*\nReview their statuses below",
          },
        },
        {
          type: "divider",
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "<http://some1.url|pr1>",
          },
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "Mergeable: `true`\nHead Commit State: `SUCCESS`\nLabels: `ready to merge`",
            },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "<http://some2.url|pr2>",
          },
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "Mergeable: `false`\nHead Commit State: `FAILURE`\nLabels: `ready to merge`, `merge train paused`",
            },
          ],
        },
        {
          type: "divider",
        },
      ]);
    });
  });
});
