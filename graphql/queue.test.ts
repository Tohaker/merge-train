describe("Queue", () => {
  let queue;

  const mockCreateClient = jest.fn();
  const mockClient = jest.fn();
  const mockQuery = "query";

  beforeEach(() => {
    jest.mock("../graphql", () => ({
      createClient: mockCreateClient,
      sortByDate: jest.requireActual("../graphql").sortByDate,
      getPullRequestsReadyForMerge: mockQuery,
      Data: jest.requireActual("../graphql").Data,
      MergeableState: jest.requireActual("../graphql").MergeableState,
    }));

    queue = require("./queue");
  });

  describe("getQueue", () => {
    beforeEach(() => {
      mockCreateClient.mockResolvedValue(mockClient);
      mockClient.mockResolvedValue({ data: true });

      process.env.GITHUB_OWNER = "owner";
      process.env.GITHUB_REPOSITORY = "repo";
    });

    it("should call the GraphQL endpoint with the correct parameters", async () => {
      const data = await queue.getQueue();

      expect(mockCreateClient).toBeCalled();
      expect(mockClient).toBeCalledWith(mockQuery, {
        owner: "owner",
        repo: "repo",
      });
      expect(data).toEqual({ data: true });
    });
  });

  describe("getItems", () => {
    it("should return just the nodes", () => {
      expect(
        queue.getItems({
          repository: { pullRequests: { nodes: ["mock node"] } },
        })
      ).toEqual(["mock node"]);
    });
  });

  describe("hasItems", () => {
    it.each([
      [{ repository: { pullRequests: { nodes: [] } } }, false],
      [{ repository: { pullRequests: { nodes: ["mock node"] } } }, true],
    ])("should return whether the queue has items", (mockQueue, expected) => {
      expect(queue.hasItems(mockQueue)).toEqual(expected);
    });
  });

  describe("getMergeableItems", () => {
    it.each([
      [{ repository: { pullRequests: { nodes: [] } } }, []],
      [
        {
          repository: {
            pullRequests: {
              nodes: [
                {
                  mergeable: "MERGEABLE",
                  timelineItems: { updatedAt: "2021-02-19T11:33:35.057Z" },
                },
                {
                  mergeable: "UNKNOWN",
                  timelineItems: { updatedAt: "2021-02-19T12:33:35.057Z" },
                },
              ],
            },
          },
        },
        [
          {
            mergeable: "MERGEABLE",
            timelineItems: { updatedAt: "2021-02-19T11:33:35.057Z" },
          },
        ],
      ],
      [
        {
          repository: {
            pullRequests: {
              nodes: [
                {
                  mergeable: "MERGEABLE",
                  timelineItems: { updatedAt: "2021-02-19T13:33:35.057Z" },
                },
                {
                  mergeable: "MERGEABLE",
                  timelineItems: { updatedAt: "2021-02-19T12:33:35.057Z" },
                },
              ],
            },
          },
        },
        [
          {
            mergeable: "MERGEABLE",
            timelineItems: { updatedAt: "2021-02-19T12:33:35.057Z" },
          },
          {
            mergeable: "MERGEABLE",
            timelineItems: { updatedAt: "2021-02-19T13:33:35.057Z" },
          },
        ],
      ],
    ])("should return whether the queue has items", (mockQueue, expected) => {
      expect(queue.getMergeableItems(mockQueue)).toEqual(expected);
    });
  });
});
