import { WebClient, ChatPostMessageArguments } from "@slack/web-api";
import fetch from "node-fetch";
import { createClient } from "./client";

jest.mock("@slack/web-api");
jest.mock("node-fetch");

const mockWebClient = WebClient as jest.MockedClass<typeof WebClient>;
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe("Client", () => {
  const mockPostSlackMessage = jest.fn();
  mockWebClient.mockImplementation(() => ({
    //@ts-ignore
    chat: {
      postMessage: mockPostSlackMessage,
    },
  }));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("given the client is Slack", () => {
    beforeEach(() => {
      process.env.CLIENT_PLATFORM = "slack";
    });

    it("should use the slack client to post a message", async () => {
      const { postMessage } = createClient();
      const slackMessage = {
        icon_emoji: "emoji",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "text",
            },
          },
        ],
        channel: "channel",
        text: "text",
      };

      await postMessage(slackMessage);

      expect(mockPostSlackMessage).toBeCalledWith(slackMessage);
      expect(mockFetch).not.toBeCalled();
    });
  });
});
