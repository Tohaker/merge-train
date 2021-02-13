describe("Parse Command", () => {
  const mockContainer = {};
  const mockList = ["http://url.1", "http://url.2"];

  const mockRespond = jest.fn();
  const mockGetList = jest.fn();

  let parseCommand;

  beforeEach(() => {
    jest.clearAllMocks();

    jest.mock("./constants", () => ({
      helpText: "help",
      invalidCommand: "invalid",
      nextSuccess: () => "next success",
      listEmpty: "list empty",
      listSuccess: () => "list success",
    }));
    jest.mock("./list", () => ({
      getList: mockGetList,
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

  describe("given the next command is sent", () => {
    describe("given the list has items", () => {
      beforeEach(() => {
        mockGetList.mockResolvedValue(mockList);
      });

      it("should send a message with the first url", async () => {
        await parseCommand({
          text: "next",
          context: { log: jest.fn() },
          respond: mockRespond,
        });

        expect(mockGetList).toBeCalled();
        expect(mockRespond).toBeCalledWith(blocks("next success"));
      });
    });

    describe("given the list has no items", () => {
      beforeEach(() => {
        mockGetList.mockResolvedValue([]);
      });

      it("should send a message that the list is empty", async () => {
        await parseCommand({
          text: "next",
          context: { log: jest.fn() },
          respond: mockRespond,
        });

        expect(mockGetList).toBeCalled();
        expect(mockRespond).toBeCalledWith(blocks("list empty"));
      });
    });
  });

  describe("given the list command is sent", () => {
    describe("given a private list is requested", () => {
      beforeEach(() => {
        mockGetList.mockResolvedValue(mockList);
      });

      it("should send a message with the entire list", async () => {
        await parseCommand({
          text: "list",
          context: { log: jest.fn() },
          respond: mockRespond,
        });

        expect(mockRespond).toBeCalledWith(response("list success"));
      });

      describe("given the list is empty", () => {
        beforeEach(() => {
          mockGetList.mockResolvedValue([]);
        });

        it("should send a message that the list is empty", async () => {
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
      beforeEach(() => {
        mockGetList.mockResolvedValue(mockList);
      });

      it("should send a message with the entire list", async () => {
        await parseCommand({
          text: "list public",
          context: { log: jest.fn() },
          respond: mockRespond,
        });

        expect(mockRespond).toBeCalledWith(blocks("list success"));
      });

      describe("given the list is empty", () => {
        beforeEach(() => {
          mockGetList.mockResolvedValue([]);
        });

        it("should send a message that the list is empty", async () => {
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
