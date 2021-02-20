import { PullRequest } from "@octokit/webhooks-definitions/schema";

describe("Auto Merge", () => {
  let handleItemAdded: (pr: PullRequest, channel: string) => Promise<void>;

  const mockGetQueue = jest.fn();
  const mockHasItems = jest.fn();
  const mockPostMessage = jest.fn();

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

    jest.mock("./queue", () => ({
      getQueue: mockGetQueue,
      hasItems: mockHasItems,
    }));

    jest.mock("./slackApi", () => ({
      postMessage: mockPostMessage,
    }));

    handleItemAdded = require("./autoMerge").handleItemAdded;
  });

  describe("given the queue has items", () => {
    beforeEach(() => {
      mockHasItems.mockReturnValue(true);
    });

    it("should not post any message", async () => {
      await handleItemAdded(mockPR, "channel");
      expect(mockPostMessage).not.toBeCalled();
    });
  });

  describe("given the queue has no items", () => {
    beforeEach(() => {
      mockHasItems.mockReturnValue(false);
    });

    describe("given the pr is not mergeable", () => {
      beforeEach(() => {
        mockPR.mergeable = false;
      });

      it("should post a message", async () => {
        await handleItemAdded(mockPR, "channel");
        expect(mockPostMessage).toBeCalledWith(
          [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text:
                  "This PR cannot be merged yet, remove the label until this is resolved.",
              },
            },
          ],
          "channel"
        );
      });
    });

    describe("given the pr is mergeable", () => {
      beforeEach(() => {
        mockPR.mergeable = true;
      });

      it("should post a message", async () => {
        await handleItemAdded(mockPR, "channel");
        expect(mockPostMessage).toBeCalledWith(
          [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "I would have merged something now, is it a good time?",
              },
            },
          ],
          "channel"
        );
      });
    });
  });
});
