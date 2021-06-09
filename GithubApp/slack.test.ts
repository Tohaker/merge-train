import { PullRequest } from "@octokit/webhooks-types";
import { createSlackPanel } from "./slack";

describe("Create Slack Panel", () => {
  const mockPullRequest = {
    html_url: "http://some.url",
    title: "PR title",
    updated_at: "2021-01-29T20:00:00Z",
  } as unknown as PullRequest;

  describe("given no assigned line is provided", () => {
    describe("given the action is not a change", () => {
      it("should generate the correct blocks", () => {
        const result = createSlackPanel({
          headline: "headline",
          pullRequest: mockPullRequest,
          creator: "me",
        });

        expect(result).toMatchObject([
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `headline:\n*<http://some.url|PR title>*`,
            },
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Created by:*\nme`,
              },
              {
                type: "mrkdwn",
                text: `*When:*\n1/29/2021, 8:00:00 PM`,
              },
            ],
          },
        ]);
      });
    });

    describe("given the action is a change", () => {
      it("should generate the correct blocks", () => {
        const result = createSlackPanel({
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
              text: `headline:\n*<http://some.url|PR title>*`,
            },
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Changed by:*\nme`,
              },
              {
                type: "mrkdwn",
                text: `*When:*\n1/29/2021, 8:00:00 PM`,
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
        const result = createSlackPanel({
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
              text: `headline:\n*<http://some.url|PR title>*`,
            },
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Created by:*\nme`,
              },
              {
                type: "mrkdwn",
                text: `*When:*\n1/29/2021, 8:00:00 PM`,
              },
            ],
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `The following people have been assigned: someone, else`,
            },
          },
        ]);
      });
    });

    describe("given the action is a change", () => {
      it("should generate the correct blocks", () => {
        const result = createSlackPanel({
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
              text: `headline:\n*<http://some.url|PR title>*`,
            },
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Changed by:*\nme`,
              },
              {
                type: "mrkdwn",
                text: `*When:*\n1/29/2021, 8:00:00 PM`,
              },
            ],
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `The following people have been assigned: someone, else`,
            },
          },
        ]);
      });
    });
  });
});
