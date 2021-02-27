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
      Queue: jest.requireActual("../graphql").Queue,
    }));
    jest.mock("../common/config", () => ({
      Label: { MERGE_TRAIN_PAUSED: "merge train paused" },
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
                  commits: {
                    nodes: [{ commit: { status: { state: "SUCCESS" } } }],
                  },
                  labels: {
                    nodes: [
                      {
                        name: "Ready for merge",
                      },
                    ],
                  },
                },
                {
                  mergeable: "UNKNOWN",
                  timelineItems: { updatedAt: "2021-02-19T12:33:35.057Z" },
                  commits: {
                    nodes: [{ commit: { status: { state: "SUCCESS" } } }],
                  },
                  labels: {
                    nodes: [
                      {
                        name: "Ready for merge",
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
        [
          {
            mergeable: "MERGEABLE",
            timelineItems: { updatedAt: "2021-02-19T11:33:35.057Z" },
            commits: {
              nodes: [{ commit: { status: { state: "SUCCESS" } } }],
            },
            labels: {
              nodes: [
                {
                  name: "Ready for merge",
                },
              ],
            },
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
                  commits: {
                    nodes: [{ commit: { status: { state: "SUCCESS" } } }],
                  },
                  labels: {
                    nodes: [
                      {
                        name: "Ready for merge",
                      },
                    ],
                  },
                },
                {
                  mergeable: "MERGEABLE",
                  timelineItems: { updatedAt: "2021-02-19T12:33:35.057Z" },
                  commits: {
                    nodes: [{ commit: { status: { state: "SUCCESS" } } }],
                  },
                  labels: {
                    nodes: [
                      {
                        name: "Ready for merge",
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
        [
          {
            mergeable: "MERGEABLE",
            timelineItems: { updatedAt: "2021-02-19T12:33:35.057Z" },
            commits: {
              nodes: [{ commit: { status: { state: "SUCCESS" } } }],
            },
            labels: {
              nodes: [
                {
                  name: "Ready for merge",
                },
              ],
            },
          },
          {
            mergeable: "MERGEABLE",
            timelineItems: { updatedAt: "2021-02-19T13:33:35.057Z" },
            commits: {
              nodes: [{ commit: { status: { state: "SUCCESS" } } }],
            },
            labels: {
              nodes: [
                {
                  name: "Ready for merge",
                },
              ],
            },
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
                  commits: {
                    nodes: [{ commit: { status: { state: "SUCCESS" } } }],
                  },
                  labels: {
                    nodes: [
                      {
                        name: "Ready for merge",
                      },
                    ],
                  },
                },
                {
                  mergeable: "MERGEABLE",
                  timelineItems: { updatedAt: "2021-02-19T12:33:35.057Z" },
                  commits: {
                    nodes: [{ commit: { status: { state: "FAILURE" } } }],
                  },
                  labels: {
                    nodes: [
                      {
                        name: "Ready for merge",
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
        [
          {
            mergeable: "MERGEABLE",
            timelineItems: { updatedAt: "2021-02-19T13:33:35.057Z" },
            commits: {
              nodes: [{ commit: { status: { state: "SUCCESS" } } }],
            },
            labels: {
              nodes: [
                {
                  name: "Ready for merge",
                },
              ],
            },
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
                  commits: {
                    nodes: [{ commit: { status: { state: "SUCCESS" } } }],
                  },
                  labels: {
                    nodes: [
                      {
                        name: "Ready for merge",
                      },
                    ],
                  },
                },
                {
                  mergeable: "MERGEABLE",
                  timelineItems: { updatedAt: "2021-02-19T12:33:35.057Z" },
                  commits: {
                    nodes: [{ commit: { status: { state: "SUCCESS" } } }],
                  },
                  labels: {
                    nodes: [
                      {
                        name: "Ready for merge",
                      },
                      {
                        name: "merge train paused",
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
        [
          {
            mergeable: "MERGEABLE",
            timelineItems: { updatedAt: "2021-02-19T13:33:35.057Z" },
            commits: {
              nodes: [{ commit: { status: { state: "SUCCESS" } } }],
            },
            labels: {
              nodes: [
                {
                  name: "Ready for merge",
                },
              ],
            },
          },
        ],
      ],
    ])(
      "should return whether the queue has mergeable items",
      (mockQueue, expected) => {
        expect(queue.getMergeableItems(mockQueue)).toEqual(expected);
      }
    );
  });
});
