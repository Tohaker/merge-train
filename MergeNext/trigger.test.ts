import { WebClient } from "@slack/web-api";

jest.mock("@slack/web-api");

const mockWebClient = WebClient as jest.MockedClass<typeof WebClient>;

enum ChannelName {
  MERGE = "merge",
  REVIEWS = "reviews",
}

describe("HTTP Trigger", () => {
  let httpTrigger;

  const mockCheckSignature = jest.fn();
  const mockGetMergeableItems = jest.fn();
  const mockGetQueue = jest.fn();
  const mockHasItems = jest.fn();

  const mockPostMessage = jest.fn();
  const mockListConversations = jest.fn(() => ({
    channels: [
      {
        name: "merge",
        id: "1234",
      },
      { name: "reviews", id: "4567" },
      { name: "qa", id: "0987" },
    ],
  }));

  const mockContext = {
    log: jest.fn(),
    done: jest.fn(),
  };

  mockWebClient.mockImplementation(() => ({
    conversations: {
      //@ts-ignore
      list: mockListConversations,
    },
    //@ts-ignore
    chat: {
      postMessage: mockPostMessage,
    },
  }));

  beforeEach(() => {
    jest.clearAllMocks();

    jest.mock("../common/checkSignature", () => ({
      checkSignature: mockCheckSignature,
    }));
    jest.mock("../common/config", () => ({
      ChannelName,
    }));
    jest.mock("../graphql/queue", () => ({
      getMergeableItems: mockGetMergeableItems,
      getQueue: mockGetQueue,
      hasItems: mockHasItems,
    }));

    httpTrigger = require(".").default;
  });

  describe("given checkSignature fails", () => {
    beforeEach(() => {
      mockCheckSignature.mockReturnValue(false);
    });

    it("should log an error and return", async () => {
      await httpTrigger(mockContext, {});

      expect(mockContext.log).toBeCalledWith(
        "Hash signature doesn't match - terminating session"
      );
      expect(mockContext.done).toBeCalledWith(null, {
        status: 401,
        body: "Hash signature doesn't match",
      });
      expect(mockWebClient).not.toBeCalled();
    });
  });

  describe("given checkSignature succeeds", () => {
    beforeEach(() => {
      mockCheckSignature.mockReturnValue(true);
    });

    describe("given the queue has no items", () => {
      beforeEach(() => {
        mockHasItems.mockReturnValue(false);
      });

      it("should post a message", async () => {
        await httpTrigger(mockContext, {});

        expect(mockPostMessage).toBeCalledWith({
          icon_emoji: ":steam_locomotive:",
          text: "All PRs have now been merged",
          channel: "1234",
        });
        expect(mockGetMergeableItems).not.toBeCalled();
      });
    });

    describe("given the queue has items", () => {
      beforeEach(() => {
        mockHasItems.mockReturnValue(true);
      });

      describe("given no items are mergeable", () => {
        beforeEach(() => {
          mockGetMergeableItems.mockReturnValue([]);
        });

        it("should post a message", async () => {
          await httpTrigger(mockContext, {});

          expect(mockPostMessage).toBeCalledWith({
            icon_emoji: ":steam_locomotive:",
            text:
              "No PRs are ready to be merged. Check the list and manually merge to start again.",
            channel: "1234",
          });
        });
      });

      describe("given there are mergeable items", () => {
        beforeEach(() => {
          mockGetMergeableItems.mockReturnValue([
            { url: "https://some.url", title: "title" },
            { url: "https://some2.url", title: "title2" },
          ]);
        });

        it("should post a message", async () => {
          await httpTrigger(mockContext, {});

          expect(mockPostMessage).toBeCalledWith({
            icon_emoji: ":steam_locomotive:",
            text:
              "<https://some.url|title> would have been merged now. Is it a good time?",
            channel: "1234",
          });
        });
      });
    });
  });
});
