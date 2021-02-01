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
  const mockSlackApi = {
    postMessage: mockPostMessage,
    createSlackPanel: mockCreateSlackPanel,
    listConversations: mockListConversations,
  };

  const mockConnectToCosmos = jest.fn(() => ({}));
  const mockCreateItem = jest.fn();
  const mockDeleteItem = jest.fn();
  const mockReadAllItems = jest.fn();
  const mockCosmos = {
    connectToCosmos: mockConnectToCosmos,
    createItem: mockCreateItem,
    deleteItem: mockDeleteItem,
    readAllItems: mockReadAllItems,
  };

  const mockContext = {
    log: jest.fn(),
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

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mock("./checkSignature", () => ({
      checkSignature: mockCheckSignature,
    }));
    jest.mock("./slackApi", () => mockSlackApi);
    jest.mock("../common/cosmos", () => mockCosmos);

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

    describe("given a labeled action is received", () => {
      beforeEach(() => {
        mockRequest.body.action = "labeled";
        mockRequest.body.label.name = "Ready to merge";
      });

      describe("given the PR url is not in the list", () => {
        beforeEach(() => {
          mockReadAllItems.mockResolvedValue([{ url: "some other url" }]);
        });

        it("should create a new item and post a message", async () => {
          mockCreateSlackPanel.mockReturnValueOnce("blocks");
          await httpTrigger(mockContext, mockRequest);

          expect(mockCreateItem).toBeCalledWith(
            {},
            mockRequest.body.pull_request.html_url
          );
          expect(mockPostMessage).toBeCalledWith("blocks", "1234");
        });
      });

      describe("given the PR url is in the list", () => {
        beforeEach(() => {
          mockReadAllItems.mockResolvedValue([
            { url: mockRequest.body.pull_request.html_url },
          ]);
        });

        it("should not create a new item or post a message", async () => {
          mockCreateSlackPanel.mockReturnValueOnce("blocks");
          await httpTrigger(mockContext, mockRequest);

          expect(mockContext.log).toBeCalledWith("PR (mockUrl) already saved");
          expect(mockCreateItem).not.toBeCalled();
          expect(mockPostMessage).not.toBeCalled();
        });
      });
    });

    describe("given an unlabeled action is received", () => {
      beforeEach(() => {
        mockRequest.body.action = "unlabeled";
        mockRequest.body.label.name = "Ready to merge";
      });

      describe("given the PR url is not in the list", () => {
        beforeEach(() => {
          mockReadAllItems.mockResolvedValue([
            { url: "some other url", id: "mockId" },
          ]);
        });

        it("should create a new item and post a message", async () => {
          mockCreateSlackPanel.mockReturnValueOnce("blocks");
          await httpTrigger(mockContext, mockRequest);

          expect(mockContext.log).toBeCalledWith("No ID found for this url");
        });
      });

      describe("given the PR url is in the list", () => {
        beforeEach(() => {
          mockReadAllItems.mockResolvedValue([
            { url: mockRequest.body.pull_request.html_url, id: "mockId" },
          ]);
        });

        it("should delete the item and post a message", async () => {
          mockCreateSlackPanel.mockReturnValueOnce("blocks");
          await httpTrigger(mockContext, mockRequest);

          expect(mockDeleteItem).toBeCalledWith({}, "mockId");
          expect(mockPostMessage).toBeCalledWith("blocks", "1234");
        });
      });
    });

    describe("given a review requested action is received", () => {
      beforeEach(() => {
        mockRequest.body.action = "review_requested";
      });

      it("should post a message to the reviews channel", async () => {
        mockCreateSlackPanel.mockReturnValueOnce("blocks");
        await httpTrigger(mockContext, mockRequest);

        expect(mockCreateSlackPanel).toBeCalledWith({
          headline: "A PR has been marked for review",
          footer: `The following people have been assigned: username username2`,
          pull_request: mockRequest.body.pull_request,
          sender: mockRequest.body.sender,
        });
        expect(mockPostMessage).toBeCalledWith("blocks", "4567");
      });
    });
  });
});
