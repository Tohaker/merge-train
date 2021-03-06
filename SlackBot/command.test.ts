describe("Parse Command", () => {
  const mockList = ["http://url.1", "http://url.2"];

  const mockRespond = jest.fn();
  const mockGetList = jest.fn();
  const mockPauseAll = jest.fn();
  const mockResumeAll = jest.fn();

  let parseCommand;

  beforeEach(() => {
    jest.clearAllMocks();

    jest.mock("../common/config", () => ({
      icon_emoji: "emoji",
    }));
    jest.mock("./constants", () => ({
      helpText: "help",
      invalidCommand: "invalid",
      nextSuccess: () => "next success",
      listEmpty: "list empty",
      listSuccess: () => "list success",
      pauseSuccess: "pause success",
      pauseFailure: "pause failure",
      resumeSuccess: "resume success",
      resumeFailure: "resume failure",
    }));
    jest.mock("./list", () => ({
      getList: mockGetList,
    }));
    jest.mock("./pause", () => ({
      pauseAll: mockPauseAll,
      resumeAll: mockResumeAll,
    }));

    parseCommand = require("./command").parseCommand;
  });

  const blocks = (text) => ({
    icon_emoji: "emoji",
    response_type: "in_channel",
    text,
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
    icon_emoji: "emoji",
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
            respond: mockRespond,
          });
          expect(mockRespond).toBeCalledWith(blocks("list empty"));
        });
      });
    });
  });

  describe("given the pause command is sent", () => {
    describe("given the pause is successful", () => {
      beforeEach(() => {
        mockPauseAll.mockResolvedValue(true);
      });

      it("should send a success message", async () => {
        await parseCommand({
          text: "pause",
          respond: mockRespond,
        });
        expect(mockRespond).toBeCalledWith(blocks("pause success"));
      });
    });

    describe("given the pause is unsuccessful", () => {
      beforeEach(() => {
        mockPauseAll.mockResolvedValue(false);
      });

      it("should send a failure message", async () => {
        await parseCommand({
          text: "pause",
          respond: mockRespond,
        });
        expect(mockRespond).toBeCalledWith(blocks("pause failure"));
      });
    });
  });

  describe("given the resume command is sent", () => {
    describe("given the resume is successful", () => {
      beforeEach(() => {
        mockResumeAll.mockResolvedValue(true);
      });

      it("should send a success message", async () => {
        await parseCommand({
          text: "resume",
          respond: mockRespond,
        });
        expect(mockRespond).toBeCalledWith(blocks("resume success"));
      });
    });

    describe("given the resume is unsuccessful", () => {
      beforeEach(() => {
        mockResumeAll.mockResolvedValue(false);
      });

      it("should send a failure message", async () => {
        await parseCommand({
          text: "resume",
          respond: mockRespond,
        });
        expect(mockRespond).toBeCalledWith(blocks("resume failure"));
      });
    });
  });

  describe("given the help command is sent", () => {
    it("should send the ephemeral message", async () => {
      await parseCommand({
        text: "help",
        respond: mockRespond,
      });

      expect(mockRespond).toBeCalledWith(response("help"));
    });
  });
});
