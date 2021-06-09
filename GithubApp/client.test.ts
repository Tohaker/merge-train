import { KnownBlock, WebClient } from "@slack/web-api";
import fetch from "node-fetch";
import { createSlackPanel } from "./slack";
import { createTeamsCard } from "./teams";
import { icon_emoji } from "../common/config";
import { createClient } from "./client";

jest.mock("@slack/web-api");
jest.mock("node-fetch");
jest.mock("./slack");
jest.mock("./teams");

const mockWebClient = WebClient as jest.MockedClass<typeof WebClient>;
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
const mockCreateSlackPanel = createSlackPanel as jest.MockedFunction<
  typeof createSlackPanel
>;
const mockCreateTeamsCard = createTeamsCard as jest.MockedFunction<
  typeof createTeamsCard
>;

describe("Client", () => {
  const mockPostSlackMessage = jest.fn();
  mockWebClient.mockImplementation(() => ({
    //@ts-ignore
    chat: {
      postMessage: mockPostSlackMessage,
    },
  }));
  const mockSlackPanel: KnownBlock[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "text",
      },
    },
  ];
  mockCreateSlackPanel.mockReturnValue(mockSlackPanel);

  const mockTeamsCard = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    themeColor: "0076D7",
    summary: "summary",
  };

  //@ts-ignore
  mockCreateTeamsCard.mockReturnValue(mockTeamsCard);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("given the client is Slack", () => {
    beforeEach(() => {
      process.env.CLIENT_PLATFORM = "slack";
    });

    it("should use the slack client to post a message", async () => {
      const { postMessage } = createClient();
      // @ts-ignore
      await postMessage({ headline: "headline", pullRequest: {} }, "channel");

      expect(mockPostSlackMessage).toBeCalledWith({
        icon_emoji,
        channel: "channel",
        blocks: mockSlackPanel,
        text: "headline",
      });
      expect(mockFetch).not.toBeCalled();
    });
  });

  describe("given the client is Teams", () => {
    beforeEach(() => {
      process.env.CLIENT_PLATFORM = "teams";
      process.env.TEAMS_INCOMING_WEBHOOK = "http://some.url";
    });

    it("should use the slack client to post a message", async () => {
      const { postMessage } = createClient();
      // @ts-ignore
      await postMessage({ headline: "headline", pullRequest: {} }, "channel");

      expect(mockFetch).toBeCalledWith("http://some.url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mockTeamsCard),
      });
      expect(mockPostSlackMessage).not.toBeCalled();
    });
  });
});
