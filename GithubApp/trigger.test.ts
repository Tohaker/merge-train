import { WebClient } from "@slack/web-api";

jest.mock("@slack/web-api");

const mockWebClient = WebClient as jest.MockedClass<typeof WebClient>;

describe("HTTP Trigger", () => {
  let httpTrigger;

  const mockCheckSignature = jest.fn();

  const mockPostMessage = jest.fn();
  const mockCreateSlackPanel = jest.fn();
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
  const mockListUsers = jest.fn();
  const mockSlack = {
    createSlackPanel: mockCreateSlackPanel,
  };
  const mockGetMergeableItems = jest.fn();
  const mockGetQueue = jest.fn();

  const webClient = {
    users: {
      list: mockListUsers,
    },
    conversations: {
      list: mockListConversations,
    },
    chat: {
      postMessage: mockPostMessage,
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

  enum Branch {
    DEFAULT = "master",
  }

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mock("../common/checkSignature", () => ({
      checkSignature: mockCheckSignature,
    }));
    jest.mock("./slack", () => mockSlack);
    jest.mock("../common/config", () => ({
      ChannelName,
      Branch,
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
      mockListUsers.mockResolvedValue({
        members: [
          {
            id: "id1",
            profile: {
              title: "username",
              display_name: "some person",
            },
          },
          {
            id: "id2",
            profile: {
              title: "username2",
              display_name: "some other person",
            },
          },
        ],
      });
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
          expect(mockPostMessage).not.toBeCalled();
        });
      });

      describe("given the state is success", () => {
        beforeEach(() => {
          mockRequest.body["state"] = "success";
        });

        it("should handleStateReported", async () => {
          await httpTrigger(mockContext, mockRequest);

          expect(mockHandleStateReported).toBeCalledWith(
            webClient,
            mockRequest.body,
            "1234"
          );
          expect(mockPostMessage).not.toBeCalled();
        });
      });
    });

    describe("given a labeled action is received", () => {
      beforeEach(() => {
        mockRequest.body.action = "labeled";
      });

      describe("given the label name is Ready for merge", () => {
        beforeEach(() => {
          mockRequest.body.label.name = "Ready for merge";
        });

        it("should post a message", async () => {
          mockCreateSlackPanel.mockReturnValueOnce("blocks");
          await httpTrigger(mockContext, mockRequest);

          expect(mockPostMessage).toBeCalledWith({
            icon_emoji: "emoji",
            text: "A new PR is ready to merge",
            blocks: "blocks",
            channel: "1234",
          });
        });
      });

      describe("given the label name is Do not merge", () => {
        beforeEach(() => {
          mockRequest.body.label.name = "Do not merge";
        });

        it("should not delete the item or post a message", async () => {
          await httpTrigger(mockContext, mockRequest);

          expect(mockPostMessage).not.toBeCalled();
        });
      });
    });

    describe("given an unlabeled action is received", () => {
      beforeEach(() => {
        mockRequest.body.action = "unlabeled";
      });

      describe("given the label name is Ready for merge", () => {
        beforeEach(() => {
          mockRequest.body.label.name = "Ready for merge";
        });

        it("should post a message", async () => {
          mockCreateSlackPanel.mockReturnValueOnce("blocks");
          await httpTrigger(mockContext, mockRequest);

          expect(mockPostMessage).toBeCalledWith({
            icon_emoji: "emoji",
            text: "A PR has had its status changed",
            blocks: "blocks",
            channel: "1234",
          });
        });
      });

      describe("given the label name is Do not merge", () => {
        beforeEach(() => {
          mockRequest.body.label.name = "Do not merge";
        });

        it("should not delete the item or post a message", async () => {
          await httpTrigger(mockContext, mockRequest);

          expect(mockPostMessage).not.toBeCalled();
        });
      });
    });

    describe("given a review requested action is received", () => {
      beforeEach(() => {
        mockRequest.body.action = "review_requested";
      });

      describe("given the request does not have a requested_team", () => {
        it("should not post a message to slack", async () => {
          await httpTrigger(mockContext, mockRequest);

          expect(mockPostMessage).not.toBeCalled();
        });
      });

      describe("given the request has a requested_team", () => {
        describe("given the slack profiles have the title property", () => {
          beforeEach(() => {
            mockListUsers.mockResolvedValue({
              members: [
                {
                  id: "id1",
                  profile: {
                    title: "username",
                    display_name: "some person",
                  },
                },
                {
                  id: "id2",
                  profile: {
                    title: "username2",
                    display_name: "some other person",
                  },
                },
              ],
            });
          });

          it("should post a message to the reviews channel", async () => {
            mockCreateSlackPanel.mockReturnValueOnce("blocks");
            mockRequest.body["requested_team"] = { name: "some team" };
            await httpTrigger(mockContext, mockRequest);

            expect(mockCreateSlackPanel).toBeCalledWith({
              headline: "A PR has been marked for review",
              footer: `The following people have been assigned: <@id1> <@id2>`,
              pull_request: mockRequest.body.pull_request,
              tag: "<@id2>",
            });
            expect(mockPostMessage).toBeCalledWith({
              icon_emoji: "emoji",
              text: "A PR has been marked for review",
              blocks: "blocks",
              channel: "4567",
            });
            delete mockRequest.body["requested_team"];
          });
        });

        describe("given the slack profiles do not have the title property", () => {
          beforeEach(() => {
            mockListUsers.mockResolvedValue({
              members: [
                {
                  id: "id1",
                  profile: {
                    display_name: "some person",
                  },
                },
                {
                  id: "id2",
                  profile: {
                    display_name: "some other person",
                  },
                },
              ],
            });
          });

          it("should post a message to the reviews channel", async () => {
            mockCreateSlackPanel.mockReturnValueOnce("blocks");
            mockRequest.body["requested_team"] = { name: "some team" };

            await httpTrigger(mockContext, mockRequest);

            expect(mockCreateSlackPanel).toBeCalledWith({
              headline: "A PR has been marked for review",
              footer: `The following people have been assigned: username username2`,
              pull_request: mockRequest.body.pull_request,
              tag: "username2",
            });
            expect(mockPostMessage).toBeCalledWith({
              icon_emoji: "emoji",
              text: "A PR has been marked for review",
              blocks: "blocks",
              channel: "4567",
            });
            delete mockRequest.body["requested_team"];
          });
        });
      });
    });
  });
});
