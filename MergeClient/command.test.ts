import { getList } from "./list";
import { pauseAll, resumeAll } from "./pause";
import { parseCommand } from "./command";

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
jest.mock("./list");
jest.mock("./pause");

const mockGetList = getList as jest.MockedFunction<typeof getList>;
const mockPauseAll = pauseAll as jest.MockedFunction<typeof pauseAll>;
const mockResumeAll = resumeAll as jest.MockedFunction<typeof resumeAll>;

jest.spyOn(console, "log").mockImplementation(() => {});

describe("Parse Command", () => {
  const mockList = ["http://url.1", "http://url.2"];

  const mockRespond = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("given the next command is sent", () => {
    describe("given the list has items", () => {
      beforeEach(() => {
        mockGetList.mockResolvedValue(mockList);
      });

      it("should send a message with the first url", async () => {
        await parseCommand({
          command: "next",
          respond: mockRespond,
        });

        expect(mockGetList).toBeCalled();
        expect(mockRespond).toBeCalledWith("next success");
      });
    });

    describe("given the list has no items", () => {
      beforeEach(() => {
        mockGetList.mockResolvedValue([]);
      });

      it("should send a message that the list is empty", async () => {
        await parseCommand({
          command: "next",
          respond: mockRespond,
        });

        expect(mockGetList).toBeCalled();
        expect(mockRespond).toBeCalledWith("list empty");
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
          command: "list",
          respond: mockRespond,
        });

        expect(mockRespond).toBeCalledWith("list success", true);
      });

      describe("given the list is empty", () => {
        beforeEach(() => {
          mockGetList.mockResolvedValue([]);
        });

        it("should send a message that the list is empty", async () => {
          await parseCommand({
            command: "list",
            respond: mockRespond,
          });
          expect(mockRespond).toBeCalledWith("list empty", true);
        });
      });
    });

    describe("given a public list is requested", () => {
      beforeEach(() => {
        mockGetList.mockResolvedValue(mockList);
      });

      it("should send a message with the entire list", async () => {
        await parseCommand({
          command: "list public",
          respond: mockRespond,
        });

        expect(mockRespond).toBeCalledWith("list success", false);
      });

      describe("given the list is empty", () => {
        beforeEach(() => {
          mockGetList.mockResolvedValue([]);
        });

        it("should send a message that the list is empty", async () => {
          await parseCommand({
            command: "list public",
            respond: mockRespond,
          });
          expect(mockRespond).toBeCalledWith("list empty", false);
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
          command: "pause",
          respond: mockRespond,
        });
        expect(mockRespond).toBeCalledWith("pause success");
      });
    });

    describe("given the pause is unsuccessful", () => {
      beforeEach(() => {
        mockPauseAll.mockResolvedValue(false);
      });

      it("should send a failure message", async () => {
        await parseCommand({
          command: "pause",
          respond: mockRespond,
        });
        expect(mockRespond).toBeCalledWith("pause failure");
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
          command: "resume",
          respond: mockRespond,
        });
        expect(mockRespond).toBeCalledWith("resume success");
      });
    });

    describe("given the resume is unsuccessful", () => {
      beforeEach(() => {
        mockResumeAll.mockResolvedValue(false);
      });

      it("should send a failure message", async () => {
        await parseCommand({
          command: "resume",
          respond: mockRespond,
        });
        expect(mockRespond).toBeCalledWith("resume failure");
      });
    });
  });

  describe("given the help command is sent", () => {
    it("should send the ephemeral message", async () => {
      await parseCommand({
        command: "help",
        respond: mockRespond,
      });

      expect(mockRespond).toBeCalledWith("help", true);
    });
  });
});
