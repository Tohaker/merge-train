import { KnownBlock, WebClient } from "@slack/web-api";
import fetch from "node-fetch";
import { createSlackMergePanel, createSlackReviewPanel } from "./slack";
import { createTeamsMergeCard, createTeamsReviewCard } from "./teams";
import { icon_emoji } from "../common/config";
import { createClient } from "./client";

jest.mock("@slack/web-api");
jest.mock("node-fetch");
jest.mock("./slack");
jest.mock("./teams");

const mockWebClient = WebClient as jest.MockedClass<typeof WebClient>;
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
const mockCreateSlackMergePanel = createSlackMergePanel as jest.MockedFunction<
  typeof createSlackMergePanel
>;
const mockCreateSlackReviewPanel =
  createSlackReviewPanel as jest.MockedFunction<typeof createSlackReviewPanel>;
const mockCreateTeamsMergeCard = createTeamsMergeCard as jest.MockedFunction<
  typeof createTeamsMergeCard
>;
const mockCreateTeamsReviewCard = createTeamsReviewCard as jest.MockedFunction<
  typeof createTeamsReviewCard
>;

describe("Client", () => {
  const mockPostSlackMessage = jest.fn();
  const mockSlackUsersList = jest.fn();
  mockWebClient.mockImplementation(() => ({
    //@ts-ignore
    chat: {
      postMessage: mockPostSlackMessage,
    },
    //@ts-ignore
    users: {
      list: mockSlackUsersList,
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
  mockCreateSlackMergePanel.mockReturnValue(mockSlackPanel);
  mockCreateSlackReviewPanel.mockReturnValue(mockSlackPanel);

  const mockTeamsCard = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    themeColor: "0076D7",
    summary: "summary",
  };

  //@ts-ignore
  mockCreateTeamsMergeCard.mockReturnValue(mockTeamsCard);
  //@ts-ignore
  mockCreateTeamsReviewCard.mockReturnValue(mockTeamsCard);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("given the client is Slack", () => {
    beforeEach(() => {
      process.env.CLIENT_PLATFORM = "slack";
    });

    it("should use the slack client to post a review message", async () => {
      const { postReviewMessage } = createClient();

      await postReviewMessage(
        // @ts-ignore
        { headline: "headline", pullRequest: {} },
        "channel"
      );

      expect(mockPostSlackMessage).toBeCalledWith({
        icon_emoji,
        channel: "channel",
        blocks: mockSlackPanel,
        text: "headline",
      });
      expect(mockFetch).not.toBeCalled();
    });

    it("should use the slack client to post a merge message", async () => {
      const { postMergeMessage } = createClient();
      const mockMergeableItems = [{ data: true }];

      //@ts-ignore
      await postMergeMessage(mockMergeableItems, "summary", "channel");

      expect(mockPostSlackMessage).toBeCalledWith({
        icon_emoji,
        channel: "channel",
        blocks: mockSlackPanel,
        text: "summary",
      });
      expect(mockFetch).not.toBeCalled();
    });

    it("should use the slack client to post a simple message", async () => {
      const { postSimpleMessage } = createClient();

      await postSimpleMessage("summary", "channel");

      expect(mockPostSlackMessage).toBeCalledWith({
        icon_emoji,
        channel: "channel",
        text: "summary",
      });
      expect(mockFetch).not.toBeCalled();
    });

    it("should format assignees correctly", async () => {
      mockSlackUsersList.mockResolvedValue({
        members: [
          { profile: { title: "user1_login" }, id: "123" },
          { profile: { title: "user3_login" }, id: "345" },
        ],
      });

      const { formatAssignees } = createClient();
      const mockReviewers = [
        {
          login: "user1_login",
        },
        {
          login: "user2_login",
        },
        {
          login: "user3_login",
        },
      ];

      //@ts-ignore
      const assignees = await formatAssignees(mockReviewers);

      expect(assignees).toEqual(["<@123>", "user2_login", "<@345>"]);
    });
  });

  describe("given the client is Teams", () => {
    beforeEach(() => {
      process.env.CLIENT_PLATFORM = "teams";
      process.env.TEAMS_INCOMING_WEBHOOK = "http://some.url";
    });

    it("should use the node-fetch to post a review message", async () => {
      const { postReviewMessage } = createClient();

      await postReviewMessage(
        // @ts-ignore
        { headline: "headline", pullRequest: {} },
        "channel"
      );

      expect(mockFetch).toBeCalledWith("http://some.url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mockTeamsCard),
      });
      expect(mockPostSlackMessage).not.toBeCalled();
    });

    it("should use the node-fetch to post a merge message", async () => {
      const { postMergeMessage } = createClient();
      const mockMergeableItems = [{ data: true }];

      await postMergeMessage(
        // @ts-ignore
        mockMergeableItems,
        "summary",
        "channel"
      );

      expect(mockFetch).toBeCalledWith("http://some.url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mockTeamsCard),
      });
      expect(mockPostSlackMessage).not.toBeCalled();
    });

    it("should use the node-fetch to post a simple message", async () => {
      const { postSimpleMessage } = createClient();

      await postSimpleMessage("message");

      expect(mockFetch).toBeCalledWith("http://some.url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: "message" }),
      });
      expect(mockPostSlackMessage).not.toBeCalled();
    });

    it("should format assignees correctly", async () => {
      const { formatAssignees } = createClient();
      const mockReviewers = [
        {
          login: "user1_login",
          name: "user1",
          id: "123",
        },
        {
          login: "user2_login",
          name: "user2",
        },
        {
          id: "345",
        },
      ];

      //@ts-ignore
      const assignees = await formatAssignees(mockReviewers);

      expect(assignees).toEqual(["user1_login", "user2_login", "345"]);
    });
  });
});
