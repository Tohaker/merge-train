describe("Auto Merge", () => {
  let handleItemAdded: (channel: string) => Promise<void>;

  const mockGetMergeableItems = jest.fn();
  const mockGetQueue = jest.fn();
  const mockHasItems = jest.fn();
  const mockPostMessage = jest.fn();

  beforeEach(() => {
    mockGetQueue.mockResolvedValue({ data: true });

    jest.mock("./queue", () => ({
      getMergeableItems: mockGetMergeableItems,
      getQueue: mockGetQueue,
      hasItems: mockHasItems,
    }));

    jest.mock("./slackApi", () => ({
      postMessage: mockPostMessage,
    }));

    handleItemAdded = require("./autoMerge").handleItemAdded;
  });

  describe("given the queue has no items", () => {
    beforeEach(() => {
      mockHasItems.mockReturnValue(false);
    });

    it("should not post any message", async () => {
      await handleItemAdded("channel");
      expect(mockPostMessage).not.toBeCalled();
    });
  });

  describe("given the queue has items", () => {
    beforeEach(() => {
      mockHasItems.mockReturnValue(true);
    });

    describe("given there are no mergeable items", () => {
      beforeEach(() => {
        mockGetMergeableItems.mockReturnValue([]);
      });

      it("should post a message", async () => {
        await handleItemAdded("channel");
        expect(mockPostMessage).toBeCalledWith(
          [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text:
                  "None of the PRs in the queue can be merged, remove the label until this is resolved.",
              },
            },
          ],
          "channel"
        );
      });
    });

    describe("given there are mergeable items", () => {
      beforeEach(() => {
        mockGetMergeableItems.mockReturnValue(["mock item"]);
      });

      it("should post a message", async () => {
        await handleItemAdded("channel");
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
