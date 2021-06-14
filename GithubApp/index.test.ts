import { WebClient } from "@slack/web-api";
import { createClient } from "./client";
import { Label } from "../common/config";
import { handleItemAdded, handleStateReported } from "./autoMerge";
import { checkSignature } from "../common/checkSignature";
import httpTrigger from ".";
import { Context } from "@azure/functions";

jest.mock("@slack/web-api");
jest.mock("./client");
jest.mock("./autoMerge");
jest.mock("../common/checkSignature");

const mockWebClient = WebClient as jest.MockedClass<typeof WebClient>;
const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;
const mockHandleItemAdded = handleItemAdded as jest.MockedFunction<
  typeof handleItemAdded
>;
const mockHandleStateReported = handleStateReported as jest.MockedFunction<
  typeof handleStateReported
>;
const mockCheckSignature = checkSignature as jest.MockedFunction<
  typeof checkSignature
>;

describe("HTTP Trigger", () => {
  const mockClient = {
    postReviewMessage: jest.fn(),
    postSimpleMessage: jest.fn(),
    postMergeMessage: jest.fn(),
    formatAssignees: jest.fn(),
  };

  mockCreateClient.mockReturnValue(mockClient);
  mockClient.formatAssignees.mockResolvedValue(["person1", "person2"]);

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

  const webClient = {
    conversations: {
      list: mockListConversations,
    },
  };

  //@ts-ignore
  mockWebClient.mockImplementation(() => webClient);

  const mockContext = {
    log: jest.fn(),
    done: jest.fn(),
  } as unknown as Context;

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

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CLIENT_PLATFORM = "slack";
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
          mockRequest.body.label.name = Label.READY_FOR_MERGE;
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

          expect(mockHandleItemAdded).toBeCalledWith(
            mockClient,
            mockRequest.body.pull_request,
            "1234"
          );
        });

        describe("given the client is teams", () => {
          beforeEach(() => {
            process.env.CLIENT_PLATFORM = "teams";
          });

          it("should post a message without a channel", async () => {
            await httpTrigger(mockContext, mockRequest);

            expect(mockClient.postReviewMessage).toBeCalledWith(
              {
                headline: "A new PR is ready to merge",
                pullRequest: mockRequest.body.pull_request,
                changed: true,
              },
              ""
            );

            expect(mockHandleItemAdded).toBeCalledWith(
              mockClient,
              mockRequest.body.pull_request,
              ""
            );
          });
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
          mockRequest.body.label.name = Label.READY_FOR_MERGE;
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

        describe("given the client is teams", () => {
          beforeEach(() => {
            process.env.CLIENT_PLATFORM = "teams";
          });

          it("should post a message without a channel", async () => {
            await httpTrigger(mockContext, mockRequest);

            expect(mockClient.postReviewMessage).toBeCalledWith(
              {
                headline: "A PR has had its status changed",
                pullRequest: mockRequest.body.pull_request,
                changed: true,
              },
              ""
            );
          });
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

          describe("given the client is teams", () => {
            beforeEach(() => {
              process.env.CLIENT_PLATFORM = "teams";
            });

            it("should post a message without a channel", async () => {
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
                ""
              );
              delete mockRequest.body["requested_team"];
            });
          });
        });
      }
    );
  });
});
