import { WebClient } from "@slack/web-api";
import { PullRequest } from "@octokit/webhooks-definitions/schema";

describe("Auto Merge", () => {
  let handleItemAdded: (
    client: WebClient,
    pr: PullRequest,
    channel: string
  ) => Promise<void>;

  const mockGetQueue = jest.fn();
  const mockGetItems = jest.fn();

  const mockWebClient: WebClient = {
    //@ts-ignore
    chat: {
      postMessage: jest.fn(),
    },
  };

  //@ts-ignore
  const mockPR: PullRequest = {
    html_url: "mockUrl",
    title: "PR",
    created_at: "1000",
    updated_at: "2000",
    requested_reviewers: [],
    mergeable: true,
  };

  beforeEach(() => {
    mockGetQueue.mockResolvedValue({ data: true });

    jest.mock("../graphql/queue", () => ({
      getQueue: mockGetQueue,
      getItems: mockGetItems,
    }));

    handleItemAdded = require("./autoMerge").handleItemAdded;
  });

  describe("given the queue has 2 items", () => {
    beforeEach(() => {
      mockGetItems.mockReturnValue([{ mergeable: true }, { mergeable: true }]);
    });

    it("should not post any message", async () => {
      await handleItemAdded(mockWebClient, mockPR, "channel");
      expect(mockWebClient.chat.postMessage).not.toBeCalled();
    });
  });

  describe("given the queue has 1 item", () => {
    beforeEach(() => {
      mockGetItems.mockReturnValue([{ mergeable: true }]);
    });

    describe("given the pr is not mergeable", () => {
      beforeEach(() => {
        mockPR.mergeable = false;
      });

      it("should post a message", async () => {
        await handleItemAdded(mockWebClient, mockPR, "channel");
        expect(mockWebClient.chat.postMessage).toBeCalledWith({
          icon_emoji: ":steam_locomotive:",
          text:
            "This PR cannot be merged yet, remove the label until this is resolved.",
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text:
                  "This PR cannot be merged yet, remove the label until this is resolved.",
              },
            },
          ],
          channel: "channel",
        });
      });
    });

    describe("given the pr is mergeable", () => {
      beforeEach(() => {
        mockPR.mergeable = true;
      });

      it("should post a message", async () => {
        await handleItemAdded(mockWebClient, mockPR, "channel");
        expect(mockWebClient.chat.postMessage).toBeCalledWith({
          icon_emoji: ":steam_locomotive:",
          text: "I would have merged something now, is it a good time?",
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "I would have merged something now, is it a good time?",
              },
            },
          ],
          channel: "channel",
        });
      });
    });
  });
});
