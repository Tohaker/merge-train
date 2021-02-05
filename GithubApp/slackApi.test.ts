describe("Slack APIs", () => {
  let slackApi;
  const mockFetch = jest
    .fn()
    .mockResolvedValue({ json: jest.fn().mockResolvedValue({ data: true }) });

  beforeEach(() => {
    jest.mock("node-fetch", () => mockFetch);
    process.env.SLACK_BOT_TOKEN = "mockToken";

    slackApi = require("./slackApi");
  });

  describe("Post Message", () => {
    it("should post a message to a channel", () => {
      const blocks = [{ text: "mocktext" }];
      const channel = "channel";
      slackApi.postMessage(blocks, channel);

      expect(mockFetch).toBeCalledWith(
        "https://slack.com/api/chat.postMessage",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer mockToken`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            icon_emoji: ":steam_locomotive:",
            channel,
            blocks,
          }),
        }
      );
    });
  });

  describe("List Conversations", () => {
    it("should get conversations", () => {
      slackApi.listConversations();

      expect(mockFetch).toBeCalledWith(
        "https://slack.com/api/conversations.list",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer mockToken`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
    });
  });

  describe("List Users", () => {
    it("should get users", () => {
      slackApi.listUsers();

      expect(mockFetch).toBeCalledWith("https://slack.com/api/users.list", {
        method: "GET",
        headers: {
          Authorization: `Bearer mockToken`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
    });
  });

  describe("Create Slack Panel", () => {
    const pull_request = {
      html_url: "pr url",
      title: "mock title",
      updated_at: "2021-01-29T20:00:00Z",
    };
    it("should create a slack panel for a change", () => {
      expect(
        slackApi.createSlackPanel({
          footer: "mock footer",
          headline: "mock headline",
          pull_request,
          tag: "username",
          changed: true,
        })
      ).toEqual([
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "mock headline:\n*<pr url|mock title>*",
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: "*Changed by:*\nusername",
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
            text: "mock footer",
          },
        },
      ]);
    });

    it("should create a slack panel for a creation", () => {
      expect(
        slackApi.createSlackPanel({
          footer: "mock footer",
          headline: "mock headline",
          pull_request,
          tag: "username",
        })
      ).toEqual([
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "mock headline:\n*<pr url|mock title>*",
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: "*Created by:*\nusername",
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
            text: "mock footer",
          },
        },
      ]);
    });
  });
});