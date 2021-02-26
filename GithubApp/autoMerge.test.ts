import { WebClient } from "@slack/web-api";
import { PullRequest, StatusEvent } from "@octokit/webhooks-definitions/schema";
import { getItems, getMergeableItems } from "../graphql/queue";
import { handleItemAdded, handleStateReported } from "./autoMerge";
import { Context } from "@azure/functions";

jest.mock("../graphql/queue");
jest.mock("../common/config", () => ({
  Branch: {
    DEFAULT: "master",
  },
  icon_emoji: "emoji",
}));

const mockGetItems = getItems as jest.MockedFunction<typeof getItems>;
const mockGetMergeableItems = getMergeableItems as jest.MockedFunction<
  typeof getMergeableItems
>;

const mockWebClient: WebClient = {
  //@ts-ignore
  chat: {
    postMessage: jest.fn(),
  },
};

describe("handleItemAdded", () => {
  //@ts-ignore
  const mockPR: PullRequest = {
    url: "mockUrl",
    title: "PR",
    created_at: "1000",
    updated_at: "2000",
    requested_reviewers: [],
    mergeable: true,
  };

  const mockContext: Context = {
    //@ts-ignore
    log: jest.fn(),
  };

  describe("given the queue has 2 items", () => {
    beforeEach(() => {
      //@ts-ignore
      mockGetItems.mockReturnValue([mockPR, mockPR]);
    });

    it("should not post any message", async () => {
      await handleItemAdded(mockWebClient, mockPR, "channel", mockContext);
      expect(mockWebClient.chat.postMessage).not.toBeCalled();
      expect(mockContext.log).toBeCalled();
    });
  });

  describe("given the queue has 1 item", () => {
    beforeEach(() => {
      //@ts-ignore
      mockGetItems.mockReturnValue([mockPR]);
    });

    describe("given the pr is not mergeable", () => {
      beforeEach(() => {
        mockPR.mergeable = false;
      });

      it("should post a message", async () => {
        await handleItemAdded(mockWebClient, mockPR, "channel", mockContext);
        expect(mockWebClient.chat.postMessage).toBeCalledWith({
          icon_emoji: "emoji",
          text:
            "This PR cannot be merged yet, remove the label until this is resolved.",
          channel: "channel",
        });
      });
    });

    describe("given the pr is mergeable", () => {
      beforeEach(() => {
        mockPR.mergeable = true;
      });

      it("should post a message", async () => {
        await handleItemAdded(mockWebClient, mockPR, "channel", mockContext);
        expect(mockWebClient.chat.postMessage).toBeCalledWith({
          icon_emoji: "emoji",
          text: "I would have merged <mockUrl|PR> now, is it a good time?",
          channel: "channel",
        });
      });
    });
  });
});

describe("handleStateReported", () => {
  let mockBody: StatusEvent;

  beforeEach(() => {
    //@ts-ignore
    mockBody = {
      branches: [
        {
          name: "master",
          commit: { sha: "1234", url: "url1" },
          protected: true,
        },
        {
          name: "some-branch",
          commit: { sha: "1357", url: "url2" },
          protected: false,
        },
      ],
      sha: "1234",
    };
  });

  describe("given the matching branch is not the default branch", () => {
    beforeEach(() => {
      mockBody.sha = "1357";
    });

    it("should do nothing", async () => {
      await handleStateReported(mockWebClient, mockBody, "1234");

      expect(mockGetMergeableItems).not.toBeCalled();
      expect(mockWebClient.chat.postMessage).not.toBeCalled();
    });
  });

  describe("given the matching branch is the default branch", () => {
    describe("given there are mergeable items", () => {
      beforeEach(() => {
        mockGetMergeableItems.mockReturnValue([
          //@ts-ignore
          {
            url: "https://some.url",
            title: "title",
          },
          //@ts-ignore
          {
            url: "https://some2.url",
            title: "title2",
          },
        ]);
      });

      it("should post a message", async () => {
        await handleStateReported(mockWebClient, mockBody, "1234");

        expect(mockWebClient.chat.postMessage).toBeCalledWith({
          icon_emoji: "emoji",
          text: `<https://some.url|title> would have been merged now. Is it a good time?`,
          channel: "1234",
        });
        expect(mockWebClient.chat.postMessage).toBeCalledTimes(1);
      });
    });

    describe("given there are no mergeable items", () => {
      beforeEach(() => {
        mockGetMergeableItems.mockReturnValue([]);
      });

      it("should post a message", async () => {
        await handleStateReported(mockWebClient, mockBody, "1234");

        expect(mockWebClient.chat.postMessage).toBeCalledWith({
          icon_emoji: "emoji",
          text:
            "The last merge was successful, but no PRs are ready to be merged.\nCheck the list and manually merge to start again.",
          channel: "1234",
        });
        expect(mockWebClient.chat.postMessage).toBeCalledTimes(1);
      });
    });
  });
});
