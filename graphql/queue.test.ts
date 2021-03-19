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
      Label: {
        MERGE_TRAIN_PAUSED: "merge train paused",
        READY_FOR_MERGE: "ready for merge",
      },
    }));

    jest.spyOn(console, "log").mockImplementation(() => {});

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
        label: "ready for merge",
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

  describe("isMergeable", () => {
    it.each([
      [
        true,
        {
          mergeable: "MERGEABLE",
          headCommitState: "SUCCESS",
          appliedLabels: ["Ready for merge"],
        },
      ],
      [
        false,
        {
          mergeable: "MERGEABLE",
          headCommitState: "FAILURE",
          appliedLabels: ["Ready for merge"],
        },
      ],
      [
        false,
        {
          mergeable: "UNKNOWN",
          headCommitState: "SUCCESS",
          appliedLabels: ["Ready for merge"],
        },
      ],
      [
        false,
        {
          mergeable: "MERGEABLE",
          headCommitState: "SUCCESS",
          appliedLabels: ["Ready for merge", "merge train paused"],
        },
      ],
    ])("should return the mergeability of a state as %s", (expected, input) => {
      expect(queue.isMergeable(input)).toBe(expected);
    });
  });

  describe("getMergeableItemsState", () => {
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
                  title: "title1",
                  url: "url1",
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
                  title: "title2",
                  url: "url2",
                },
              ],
            },
          },
        },
        [
          {
            mergeable: "MERGEABLE",
            headCommitState: "SUCCESS",
            appliedLabels: ["Ready for merge"],
            url: "url1",
            title: "title1",
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
            headCommitState: "SUCCESS",
            appliedLabels: ["Ready for merge"],
            url: "url2",
            title: "title2",
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
                  url: "url1",
                  title: "title1",
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
                  url: "url2",
                  title: "title2",
                },
              ],
            },
          },
        },
        [
          {
            mergeable: "MERGEABLE",
            headCommitState: "SUCCESS",
            appliedLabels: ["Ready for merge"],
            url: "url2",
            title: "title2",
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
            headCommitState: "SUCCESS",
            appliedLabels: ["Ready for merge"],
            url: "url1",
            title: "title1",
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
                  url: "url1",
                  title: "title1",
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
                  url: "url2",
                  title: "title2",
                },
              ],
            },
          },
        },
        [
          {
            mergeable: "MERGEABLE",
            headCommitState: "FAILURE",
            appliedLabels: ["Ready for merge"],
            url: "url2",
            title: "title2",
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
          {
            mergeable: "MERGEABLE",
            headCommitState: "SUCCESS",
            appliedLabels: ["Ready for merge"],
            url: "url1",
            title: "title1",
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
                  url: "url1",
                  title: "title1",
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
                  url: "url2",
                  title: "title2",
                },
              ],
            },
          },
        },
        [
          {
            mergeable: "MERGEABLE",
            headCommitState: "SUCCESS",
            appliedLabels: ["Ready for merge", "merge train paused"],
            url: "url2",
            title: "title2",
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
          {
            mergeable: "MERGEABLE",
            headCommitState: "SUCCESS",
            appliedLabels: ["Ready for merge"],
            url: "url1",
            title: "title1",
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
      "should return mergeable state of each item in the queue",
      (mockQueue, expected) => {
        expect(queue.getMergeableItemsState(mockQueue)).toEqual(expected);
      }
    );
  });
});
