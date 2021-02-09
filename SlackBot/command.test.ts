describe("Parse Command", () => {
  const mockContainer = {};
  const mockItems = [
    { url: "http://url.1", id: "1" },
    { url: "http://url.2", id: "2" },
  ];

  const mockConnectToCosmos = jest.fn().mockReturnValue(mockContainer);
  const mockCreateItem = jest.fn();
  const mockDeleteItem = jest.fn();
  const mockReadAllItems = jest.fn();

  const mockRespond = jest.fn();

  let parseCommand;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReadAllItems.mockResolvedValue(mockItems);

    jest.mock("../common/cosmos", () => ({
      connectToCosmos: mockConnectToCosmos,
      createItem: mockCreateItem,
      deleteItem: mockDeleteItem,
      readAllItems: mockReadAllItems,
    }));
    jest.mock("./constants", () => ({
      helpText: "help",
      invalidCommand: "invalid",
      addSuccess: () => "add success",
      addError: "add error",
      nextSuccess: () => "next success",
      listEmpty: "list empty",
      listSuccess: () => "list success",
      unshiftSuccess: () => "unshift success",
      unshiftError: () => "unshift error",
      popSuccess: () => "pop success",
      popError: () => "pop error",
      clearError: "clear error",
      clearSuccess: () => "clear success",
    }));

    parseCommand = require("./command").parseCommand;
  });

  const blocks = (text) => ({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text,
        },
      },
    ],
  });

  const response = (text) => ({
    response_type: "ephemeral",
    text,
  });

  describe("given the add command is sent", () => {
    describe("given the item creation is successful", () => {
      beforeEach(() => {
        mockCreateItem.mockResolvedValueOnce(true);
      });

      it("should send a success message", async () => {
        await parseCommand({
          text: "add http://some.url",
          context: { log: jest.fn() },
          respond: mockRespond,
        });

        expect(mockConnectToCosmos).toBeCalled();
        expect(mockCreateItem).toBeCalledWith(mockContainer, "http://some.url");
        expect(mockRespond).toBeCalledWith(blocks("add success"));
      });
    });

    describe("given the item creation is not successful", () => {
      beforeEach(() => {
        mockCreateItem.mockRejectedValueOnce(false);
      });

      it("should send an error message", async () => {
        await parseCommand({
          text: "add http://some.url",
          context: { log: jest.fn() },
          respond: mockRespond,
        });

        expect(mockConnectToCosmos).toBeCalled();
        expect(mockCreateItem).toBeCalledWith(mockContainer, "http://some.url");
        expect(mockRespond).toBeCalledWith(response("add error"));
      });
    });
  });

  describe("given the next command is sent", () => {
    it("should send a message with the first url", async () => {
      await parseCommand({
        text: "next",
        context: { log: jest.fn() },
        respond: mockRespond,
      });

      expect(mockConnectToCosmos).toBeCalled();
      expect(mockRespond).toBeCalledWith(blocks("next success"));
    });
  });

  describe("given the list command is sent", () => {
    describe("given a private list is requested", () => {
      it("should send a message with the entire list", async () => {
        await parseCommand({
          text: "list",
          context: { log: jest.fn() },
          respond: mockRespond,
        });

        expect(mockConnectToCosmos).toBeCalled();
        expect(mockRespond).toBeCalledWith(response("list success"));
      });

      describe("given the list is empty", () => {
        it("should send a message that the list is empty", async () => {
          mockReadAllItems.mockResolvedValueOnce([]);
          await parseCommand({
            text: "list",
            context: { log: jest.fn() },
            respond: mockRespond,
          });
          expect(mockRespond).toBeCalledWith(response("list empty"));
        });
      });
    });

    describe("given a public list is requested", () => {
      it("should send a message with the entire list", async () => {
        await parseCommand({
          text: "list public",
          context: { log: jest.fn() },
          respond: mockRespond,
        });

        expect(mockConnectToCosmos).toBeCalled();
        expect(mockRespond).toBeCalledWith(blocks("list success"));
      });

      describe("given the list is empty", () => {
        it("should send a message that the list is empty", async () => {
          mockReadAllItems.mockResolvedValueOnce([]);
          await parseCommand({
            text: "list public",
            context: { log: jest.fn() },
            respond: mockRespond,
          });
          expect(mockRespond).toBeCalledWith(blocks("list empty"));
        });
      });
    });
  });

  describe("given the unshift command is sent", () => {
    describe("given the delete is successful", () => {
      it("should delete the first item", async () => {
        await parseCommand({
          text: "unshift",
          context: { log: jest.fn() },
          respond: mockRespond,
        });

        expect(mockDeleteItem).toBeCalledWith(mockContainer, "1");
        expect(mockRespond).toBeCalledWith(blocks("unshift success"));
      });
    });

    describe("given the delete is unsuccessful", () => {
      it("should return with an error", async () => {
        mockDeleteItem.mockRejectedValueOnce(false);
        await parseCommand({
          text: "unshift",
          context: { log: jest.fn() },
          respond: mockRespond,
        });

        expect(mockDeleteItem).toBeCalledWith(mockContainer, "1");
        expect(mockRespond).toBeCalledWith(response("unshift error"));
      });
    });
  });

  describe("given the pop command is sent", () => {
    describe("given the delete is successful", () => {
      it("should delete the last item", async () => {
        await parseCommand({
          text: "pop",
          context: { log: jest.fn() },
          respond: mockRespond,
        });

        expect(mockDeleteItem).toBeCalledWith(mockContainer, "2");
        expect(mockRespond).toBeCalledWith(blocks("pop success"));
      });
    });

    describe("given the delete is unsuccessful", () => {
      it("should return with an error", async () => {
        mockDeleteItem.mockRejectedValueOnce(false);
        await parseCommand({
          text: "pop",
          context: { log: jest.fn() },
          respond: mockRespond,
        });

        expect(mockDeleteItem).toBeCalledWith(mockContainer, "2");
        expect(mockRespond).toBeCalledWith(response("pop error"));
      });
    });
  });

  describe("given the clear command is sent", () => {
    describe("given the delete commands are successful", () => {
      it("should delete all items", async () => {
        await parseCommand({
          text: "clear",
          context: { log: jest.fn() },
          respond: mockRespond,
        });

        expect(mockDeleteItem).toBeCalledTimes(2);
        expect(mockDeleteItem).toBeCalledWith(mockContainer, "1");
        expect(mockDeleteItem).toBeCalledWith(mockContainer, "2");
        expect(mockRespond).toBeCalledWith(blocks("clear success"));
      });
    });

    describe("given the delete commands are unsuccessful", () => {
      it("should delete all items", async () => {
        mockDeleteItem.mockRejectedValue(false);
        await parseCommand({
          text: "clear",
          context: { log: jest.fn() },
          respond: mockRespond,
        });

        expect(mockRespond).toBeCalledWith(response("clear error"));
      });
    });
  });

  describe("given the help command is sent", () => {
    it("should send the ephemeral message", async () => {
      await parseCommand({
        text: "help",
        context: { log: jest.fn() },
        respond: mockRespond,
      });

      expect(mockRespond).toBeCalledWith(response("help"));
    });
  });
});
