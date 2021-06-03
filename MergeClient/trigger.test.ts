import { Context, HttpRequest } from "@azure/functions";
import { App } from "@slack/bolt";
import { AzureFunctionsReceiver } from "bolt-azure-functions-receiver";
import httpTrigger from ".";

jest.mock("@slack/bolt");
jest.mock("bolt-azure-functions-receiver");

const appMock = App as jest.MockedClass<typeof App>;

describe("HTTP Trigger", () => {
  const mockContext: Context = {
    //@ts-ignore
    log: jest.fn(),
    done: jest.fn(),
  };

  const mockRequest: HttpRequest = {
    method: "POST",
    url: "http://fake.url",
    headers: {},
    query: {},
    params: {},
  };

  describe("given the trigger is invoked", () => {
    beforeEach(async () => {
      jest.clearAllMocks();

      process.env.SLACK_SIGNING_SECRET = "signing secret";
      process.env.SLACK_BOT_TOKEN = "bot token";

      await httpTrigger(mockContext, mockRequest);
    });

    it("should create a new Slack App listener", () => {
      expect(appMock).toBeCalledWith({
        token: "bot token",
        signingSecret: "signing secret",
        receiver: expect.any(AzureFunctionsReceiver),
      });
    });

    it("should setup a /merge command", () => {
      const appInstance = appMock.mock.instances[0];
      expect(appInstance.command).toBeCalledWith(
        "/merge",
        expect.any(Function)
      );
    });
  });
});
