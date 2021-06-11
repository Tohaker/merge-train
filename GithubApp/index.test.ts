import { WebClient } from "@slack/web-api";
import { createClient } from "./client";

jest.mock("@slack/web-api");
jest.mock("./client");

const mockWebClient = WebClient as jest.MockedClass<typeof WebClient>;
const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

describe("HTTP Trigger", () => {
  let httpTrigger;

  const mockClient = {
    postReviewMessage: jest.fn(),
    postSimpleMessage: jest.fn(),
    postMergeMessage: jest.fn(),
    formatAssignees: jest.fn(),
  };

  mockCreateClient.mockReturnValue(mockClient);

  const mockCheckSignature = jest.fn();

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
  const mockGetMergeableItems = jest.fn();
  const mockGetQueue = jest.fn();

  const webClient = {
    conversations: {
      list: mockListConversations,
    },
  };

  //@ts-ignore
  mockWebClient.mockImplementation(() => webClient);

  const mockHandleItemAdded = jest.fn();
  const mockHandleStateReported = jest.fn();

  const mockContext = {
    log: jest.fn(),
    done: jest.fn(),
  };
  const mockRequest = {
    body: {
      action: "",
      pull_request: {
        html_url: "mockUrl",
        title: "pr title",
        created_at: "2021-01-29T19:00:00Z",
        updated_at: "2021-01-29T20:00:00Z",
        requested_reviewers: [
          {
            login: "username",
            avatar_url: "avatar url",
          },
          {
            login: "username2",
            avatar_url: "avatar2 url",
          },
        ],
        draft: false,
      },
      label: {
        name: "",
      },
      sender: {
        login: "username2",
        avatar_url: "avatar2 url",
      },
    },
  };
  enum ChannelName {
    MERGE = "merge",
    REVIEWS = "reviews",
  }

  enum Label {
    READY_FOR_MERGE = "ready for merge",
  }

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mock("../common/checkSignature", () => ({
      checkSignature: mockCheckSignature,
    }));
    jest.mock("../common/config", () => ({
      ChannelName,
      Label,
      icon_emoji: "emoji",
    }));
    jest.mock("./autoMerge", () => ({
      handleItemAdded: mockHandleItemAdded,
      handleStateReported: mockHandleStateReported,
    }));
    jest.mock("../graphql/queue", () => ({
      getMergeableItems: mockGetMergeableItems,
      getQueue: mockGetQueue,
    }));

    httpTrigger = require(".").default;
  });

  describe("given checkSignature fails", () => {
    beforeEach(() => {
      mockCheckSignature.mockReturnValue(false);
    });

    it("should log an error and return", () => {
      httpTrigger(mockContext, mockRequest);

      expect(mockContext.log).toBeCalledWith(
        "Hash signature doesn't match - terminating session"
      );
      expect(mockListConversations).not.toBeCalled();
    });
  });

  describe("given checkSignature succeeds", () => {
    beforeEach(() => {
      mockCheckSignature.mockReturnValue(true);
    });

    describe("given a status webhook is received", () => {
      afterEach(() => {
        mockRequest.body["state"] = undefined;
      });

      describe("given the state is not success", () => {
        beforeEach(() => {
          mockRequest.body["state"] = "failed";
        });

        it("should do nothing", async () => {
          await httpTrigger(mockContext, mockRequest);

          expect(mockHandleStateReported).not.toBeCalled();
          expect(mockClient.postReviewMessage).not.toBeCalled();
        });
      });

      describe("given the state is success", () => {
        beforeEach(() => {
          mockRequest.body["state"] = "success";
        });

        it("should handleStateReported", async () => {
          await httpTrigger(mockContext, mockRequest);

          expect(mockHandleStateReported).toBeCalledWith(
            mockClient,
            mockRequest.body,
            "1234"
          );
          expect(mockClient.postReviewMessage).not.toBeCalled();
        });
      });
    });

    describe("given a labeled action is received", () => {
      beforeEach(() => {
        mockRequest.body.action = "labeled";
      });

      describe("given the label name is ready for merge", () => {
        beforeEach(() => {
          mockRequest.body.label.name = "ready for merge";
        });

        it("should post a message", async () => {
          await httpTrigger(mockContext, mockRequest);

          expect(mockClient.postReviewMessage).toBeCalledWith(
            {
              headline: "A new PR is ready to merge",
              pullRequest: mockRequest.body.pull_request,
              changed: true,
            },
            "1234"
          );
        });
      });

      describe("given the label name is Do not merge", () => {
        beforeEach(() => {
          mockRequest.body.label.name = "Do not merge";
        });

        it("should not delete the item or post a message", async () => {
          await httpTrigger(mockContext, mockRequest);

          expect(mockClient.postReviewMessage).not.toBeCalled();
        });
      });
    });

    describe("given an unlabeled action is received", () => {
      beforeEach(() => {
        mockRequest.body.action = "unlabeled";
      });

      describe("given the label name is ready for merge", () => {
        beforeEach(() => {
          mockRequest.body.label.name = "ready for merge";
        });

        it("should post a message", async () => {
          await httpTrigger(mockContext, mockRequest);

          expect(mockClient.postReviewMessage).toBeCalledWith(
            {
              headline: "A PR has had its status changed",
              pullRequest: mockRequest.body.pull_request,
              changed: true,
            },
            "1234"
          );
        });
      });

      describe("given the label name is Do not merge", () => {
        beforeEach(() => {
          mockRequest.body.label.name = "Do not merge";
        });

        it("should not delete the item or post a message", async () => {
          await httpTrigger(mockContext, mockRequest);

          expect(mockClient.postReviewMessage).not.toBeCalled();
        });
      });
    });

    describe.each([["review_requested"], ["ready_for_review"]])(
      "given a %s action is received",
      (action) => {
        beforeEach(() => {
          mockRequest.body.action = action;
        });

        describe("given the request does not have a requested_team", () => {
          it("should not post a message to slack", async () => {
            await httpTrigger(mockContext, mockRequest);

            expect(mockClient.postReviewMessage).not.toBeCalled();
          });
        });

        describe("given the pull request is in draft", () => {
          beforeEach(() => {
            mockRequest.body.pull_request.draft = true;
          });

          afterEach(() => {
            mockRequest.body.pull_request.draft = false;
          });

          it("should not post a message to slack", async () => {
            await httpTrigger(mockContext, mockRequest);

            expect(mockClient.postReviewMessage).not.toBeCalled();
          });
        });

        describe("given the request has a requested_team", () => {
          it("should post a message to the reviews channel", async () => {
            mockClient.formatAssignees.mockResolvedValue([{ data: true }]);
            mockRequest.body["requested_team"] = { name: "some team" };

            await httpTrigger(mockContext, mockRequest);

            expect(mockClient.postReviewMessage).toBeCalledWith(
              {
                headline: "A PR has been marked for review",
                pullRequest: mockRequest.body.pull_request,
                changed: true,
                assigned: [{ data: true }],
              },
              "4567"
            );
            delete mockRequest.body["requested_team"];
          });
        });
      }
    );
  });
});
