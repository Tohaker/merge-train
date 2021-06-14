import { PullRequest, StatusEvent } from "@octokit/webhooks-types";
import {
  getItems,
  getMergeableItemsState,
  isMergeable,
  getQueue,
} from "../graphql/queue";
import {
  addLabelToPullRequest,
  getCommitStatus,
  mergePullRequest,
  createClient,
} from "../graphql";
import { handleItemAdded, handleStateReported } from "./autoMerge";
import { formatLink } from "./client";

jest.mock("../graphql/queue");
jest.mock("../graphql");
jest.mock("../common/config", () => ({
  Branch: {
    DEFAULT: "master",
  },
  Label: {
    MERGE_TRAIN_PAUSED: "merge train paused",
  },
  mergeMethods: [
    {
      branch: new RegExp("^release/"),
      mergeMethod: "REBASE",
    },
    {
      branch: new RegExp("\\S*"),
      mergeMethod: "SQUASH",
    },
  ],
}));
jest.mock("./client");

const mockGetQueue = getQueue as jest.MockedFunction<typeof getQueue>;
const mockGetItems = getItems as jest.MockedFunction<typeof getItems>;
const mockGetMergeableItemsState =
  getMergeableItemsState as jest.MockedFunction<typeof getMergeableItemsState>;
const mockIsMergeable = isMergeable as jest.MockedFunction<typeof isMergeable>;
const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;
const mockFormatLink = formatLink as jest.MockedFunction<typeof formatLink>;

const mockClient = jest.fn();

const mockPlatformClient = {
  postSimpleMessage: jest.fn(),
  postMergeMessage: jest.fn(),
  postReviewMessage: jest.fn(),
  formatAssignees: jest.fn(),
};

jest.spyOn(console, "log").mockImplementation(jest.fn());

beforeEach(() => {
  //@ts-ignore
  mockCreateClient.mockResolvedValue(mockClient);
  process.env.MERGE_ENABLED = "true";
});

describe("handleItemAdded", () => {
  //@ts-ignore
  const mockPR: PullRequest = {
    html_url: "mockUrl",
    title: "PR",
    node_id: "nodeid123",
    created_at: "1000",
    updated_at: "2000",
    requested_reviewers: [],
    mergeable: true,
    //@ts-ignore
    head: {
      ref: "release/some-branch",
    },
  };

  describe("given the queue has 2 items", () => {
    beforeEach(() => {
      mockGetQueue.mockResolvedValue({
        repository: {
          //@ts-ignore
          pullRequests: { nodes: null },
          defaultBranchRef: {
            //@ts-ignore
            target: {
              commitUrl: "https://commit.url",
            },
          },
        },
      });
      //@ts-ignore
      mockGetItems.mockReturnValue([mockPR, mockPR]);
    });

    it("should not post any message", async () => {
      await handleItemAdded(mockPlatformClient, mockPR, "channel");
      expect(mockPlatformClient.postSimpleMessage).not.toBeCalled();
    });

    describe("given any item in the queue has a paused label", () => {
      beforeEach(() => {
        const mockQueue = {
          repository: {
            pullRequests: {
              nodes: [
                {
                  labels: {
                    nodes: [
                      { id: "123", name: "ready for merge" },
                      { id: "456", name: "merge train paused" },
                    ],
                  },
                },
                {
                  labels: {
                    nodes: [{ id: "123", name: "ready for merge" }],
                  },
                },
              ],
            },
          },
        };
        //@ts-ignore
        mockGetQueue.mockResolvedValueOnce(mockQueue);
      });

      it("should add a label to the pull request", async () => {
        await handleItemAdded(mockPlatformClient, mockPR, "channel");

        expect(mockClient).toBeCalledWith(addLabelToPullRequest, {
          labelId: "456",
          pullRequestId: "nodeid123",
        });
      });
    });

    describe("given no items in the queue have a paused label", () => {
      beforeEach(() => {
        const mockQueue = {
          repository: {
            pullRequests: {
              nodes: [
                {
                  labels: {
                    nodes: [{ id: "123", name: "ready for merge" }, ,],
                  },
                },
                {
                  labels: {
                    nodes: [{ id: "123", name: "ready for merge" }],
                  },
                },
              ],
            },
          },
        };
        //@ts-ignore
        mockGetQueue.mockResolvedValueOnce(mockQueue);
      });

      it("should not add a label to the pull request", async () => {
        await handleItemAdded(mockPlatformClient, mockPR, "channel");

        expect(mockClient).not.toBeCalled();
      });
    });
  });

  describe("given the queue has 1 item", () => {
    beforeEach(() => {
      mockGetQueue.mockResolvedValue({
        repository: {
          //@ts-ignore
          pullRequests: { nodes: null },
          defaultBranchRef: {
            //@ts-ignore
            target: {
              commitUrl: "https://commit.url",
            },
          },
        },
      });
      //@ts-ignore
      mockGetItems.mockReturnValue([mockPR]);
    });

    describe("given the queue is paused", () => {
      beforeEach(() => {
        const mockQueue = {
          repository: {
            pullRequests: {
              nodes: [
                {
                  labels: {
                    nodes: [
                      { id: "123", name: "ready for merge" },
                      { id: "456", name: "merge train paused" },
                    ],
                  },
                },
                {
                  labels: {
                    nodes: [{ id: "123", name: "ready for merge" }],
                  },
                },
              ],
            },
          },
        };
        //@ts-ignore
        mockGetQueue.mockResolvedValueOnce(mockQueue);
      });

      it("should do nothing", async () => {
        await handleItemAdded(mockPlatformClient, mockPR, "channel");

        expect(mockClient).not.toBeCalledWith(getCommitStatus, {
          commitRef: "https://commit.url",
        });
        expect(mockClient).not.toBeCalledWith(mergePullRequest, {
          prId: "nodeid123",
          mergeMethod: "REBASE",
        });
        expect(mockPlatformClient.postSimpleMessage).not.toBeCalled();
      });
    });

    describe("given MERGE_ENABLED is true", () => {
      beforeEach(() => {
        process.env.MERGE_ENABLED = "true";
      });
      describe("given the default branch head commit has a successful status", () => {
        beforeEach(() => {
          mockClient.mockResolvedValue({
            resource: { status: { state: "SUCCESS" } },
          });
        });

        describe("given the pr is mergeable", () => {
          beforeEach(() => {
            const mockQueue = {
              repository: {
                defaultBranchRef: {
                  target: {
                    commitUrl: "https://commit.url",
                  },
                },
                pullRequests: {
                  nodes: [
                    {
                      labels: {
                        nodes: [{ id: "123", name: "ready for merge" }],
                      },
                    },
                    {
                      labels: {
                        nodes: [{ id: "123", name: "ready for merge" }],
                      },
                    },
                  ],
                },
              },
            };
            //@ts-ignore
            mockGetQueue.mockResolvedValue(mockQueue);
            mockPR.mergeable = true;
          });

          describe('given the head ref starts with "release/"', () => {
            it("should rebase the pull request", async () => {
              await handleItemAdded(mockPlatformClient, mockPR, "channel");

              expect(mockClient).toBeCalledWith(getCommitStatus, {
                commitRef: "https://commit.url",
              });
              expect(mockClient).toBeCalledWith(mergePullRequest, {
                prId: "nodeid123",
                mergeMethod: "REBASE",
              });
              expect(mockPlatformClient.postSimpleMessage).not.toBeCalled();
            });
          });

          describe("given the head ref starts with anything else", () => {
            beforeEach(() => {
              mockPR.head.ref = "bugfix/some-branch";
            });

            it("should squash merge the pull request", async () => {
              await handleItemAdded(mockPlatformClient, mockPR, "channel");

              expect(mockClient).toBeCalledWith(getCommitStatus, {
                commitRef: "https://commit.url",
              });
              expect(mockClient).toBeCalledWith(mergePullRequest, {
                prId: "nodeid123",
                mergeMethod: "SQUASH",
              });
              expect(mockPlatformClient.postSimpleMessage).not.toBeCalled();
            });
          });
        });

        describe("given the pr is not mergeable", () => {
          beforeEach(() => {
            mockPR.mergeable = false;
            mockFormatLink.mockReturnValue("<mockUrl|PR>");
          });

          it("should post a message", async () => {
            await handleItemAdded(mockPlatformClient, mockPR, "channel");
            expect(mockPlatformClient.postSimpleMessage).toBeCalledWith(
              "<mockUrl|PR> cannot be merged yet, remove the label until this is resolved.",
              "channel"
            );
          });
        });
      });

      describe("given the default branch head commit has a pending status", () => {
        beforeEach(() => {
          mockClient.mockResolvedValue({
            resource: { status: { state: "PENDING" } },
          });
        });

        it("should not post a message", async () => {
          await handleItemAdded(mockPlatformClient, mockPR, "channel");

          expect(mockClient).toBeCalledWith(getCommitStatus, {
            commitRef: "https://commit.url",
          });
          expect(mockPlatformClient.postSimpleMessage).not.toBeCalled();
        });
      });
    });

    describe("given MERGE_ENABLED is false", () => {
      beforeEach(() => {
        process.env.MERGE_ENABLED = "false";
      });
      describe("given the default branch head commit has a successful status", () => {
        beforeEach(() => {
          mockClient.mockResolvedValue({
            resource: { status: { state: "SUCCESS" } },
          });
        });

        describe("given the pr is mergeable", () => {
          beforeEach(() => {
            const mockQueue = {
              repository: {
                defaultBranchRef: {
                  target: {
                    commitUrl: "https://commit.url",
                  },
                },
                pullRequests: {
                  nodes: [
                    {
                      labels: {
                        nodes: [{ id: "123", name: "ready for merge" }],
                      },
                    },
                    {
                      labels: {
                        nodes: [{ id: "123", name: "ready for merge" }],
                      },
                    },
                  ],
                },
              },
            };
            //@ts-ignore
            mockGetQueue.mockResolvedValue(mockQueue);
            mockPR.mergeable = true;
          });

          describe('given the head ref starts with "release/"', () => {
            it("should not rebase the pull request", async () => {
              await handleItemAdded(mockPlatformClient, mockPR, "channel");

              expect(mockClient).toBeCalledWith(getCommitStatus, {
                commitRef: "https://commit.url",
              });
              expect(mockClient).not.toBeCalledWith(mergePullRequest, {
                prId: "nodeid123",
                mergeMethod: "REBASE",
              });
              expect(mockPlatformClient.postSimpleMessage).not.toBeCalled();
            });
          });

          describe("given the head ref starts with anything else", () => {
            beforeEach(() => {
              mockPR.head.ref = "bugfix/some-branch";
            });

            it("should not squash merge the pull request", async () => {
              await handleItemAdded(mockPlatformClient, mockPR, "channel");

              expect(mockClient).toBeCalledWith(getCommitStatus, {
                commitRef: "https://commit.url",
              });
              expect(mockClient).not.toBeCalledWith(mergePullRequest, {
                prId: "nodeid123",
                mergeMethod: "SQUASH",
              });
              expect(mockPlatformClient.postSimpleMessage).not.toBeCalled();
            });
          });
        });

        describe("given the pr is not mergeable", () => {
          beforeEach(() => {
            mockPR.mergeable = false;
            mockFormatLink.mockReturnValue("<mockUrl|PR>");
          });

          it("should post a message", async () => {
            await handleItemAdded(mockPlatformClient, mockPR, "channel");
            expect(mockPlatformClient.postSimpleMessage).toBeCalledWith(
              "<mockUrl|PR> cannot be merged yet, remove the label until this is resolved.",
              "channel"
            );
          });
        });
      });

      describe("given the default branch head commit has a pending status", () => {
        beforeEach(() => {
          mockClient.mockResolvedValue({
            resource: { status: { state: "PENDING" } },
          });
        });

        it("should not post a message", async () => {
          await handleItemAdded(mockPlatformClient, mockPR, "channel");

          expect(mockClient).toBeCalledWith(getCommitStatus, {
            commitRef: "https://commit.url",
          });
          expect(mockPlatformClient.postSimpleMessage).not.toBeCalled();
        });
      });
    });
  });
});

describe("handleStateReported", () => {
  let mockBody: StatusEvent;

  beforeEach(() => {
    //@ts-ignore
    mockBody = {
      branches: [
        {
          name: "master",
          commit: { sha: "1234", url: "url1" },
          protected: true,
        },
        {
          name: "some-branch",
          commit: { sha: "1357", url: "url2" },
          protected: false,
        },
      ],
      sha: "1234",
    };
  });

  describe("given the matching branch is not the default branch", () => {
    beforeEach(() => {
      mockBody.sha = "1357";
    });

    it("should do nothing", async () => {
      await handleStateReported(mockPlatformClient, mockBody, "1234");

      expect(mockGetMergeableItemsState).not.toBeCalled();
      expect(mockPlatformClient.postMergeMessage).not.toBeCalled();
    });
  });

  describe("given the matching branch is the default branch", () => {
    describe("given there are mergeable items", () => {
      describe('given the headRefName starts with "release/"', () => {
        beforeEach(() => {
          mockGetMergeableItemsState.mockReturnValue([
            //@ts-ignore
            {
              url: "https://some.url",
              title: "title",
              id: "nodeId",
              headRefName: "release/some-branch",
            },
            //@ts-ignore
            {
              url: "https://some2.url",
              title: "title2",
              id: "nodeId2",
              headRefName: "fix/some-branch",
            },
          ]);
          mockIsMergeable.mockReturnValue(true);
        });

        it("should merge the pull request", async () => {
          await handleStateReported(mockPlatformClient, mockBody, "1234");

          expect(mockClient).toBeCalledWith(mergePullRequest, {
            prId: "nodeId",
            mergeMethod: "REBASE",
          });
          expect(mockPlatformClient.postMergeMessage).not.toBeCalled();
        });
      });

      describe("given the headRefName starts with anything else", () => {
        beforeEach(() => {
          mockGetMergeableItemsState.mockReturnValue([
            //@ts-ignore
            {
              url: "https://some2.url",
              title: "title2",
              id: "nodeId2",
              headRefName: "fix/some-branch",
            },
            //@ts-ignore
            {
              url: "https://some.url",
              title: "title",
              id: "nodeId",
              headRefName: "release/some-branch",
            },
          ]);
          mockIsMergeable.mockReturnValue(true);
        });

        it("should merge the pull request", async () => {
          await handleStateReported(mockPlatformClient, mockBody, "1234");

          expect(mockClient).toBeCalledWith(mergePullRequest, {
            prId: "nodeId2",
            mergeMethod: "SQUASH",
          });
          expect(mockPlatformClient.postMergeMessage).not.toBeCalled();
        });
      });
    });

    describe("given there are no mergeable items", () => {
      beforeEach(() => {
        mockGetMergeableItemsState.mockReturnValue([
          //@ts-ignore
          {
            mergeable: "CONFLICTING",
            headCommitState: "SUCCESS",
            appliedLabels: ["Ready for merge"],
            url: "https://some.url",
            title: "title",
          },
          //@ts-ignore
          {
            mergeable: "UNKNOWN",
            headCommitState: "FAILURE",
            appliedLabels: ["Ready for merge", "merge train paused"],
            url: "https://some2.url",
            title: "title2",
          },
        ]);
        mockIsMergeable.mockReturnValue(false);
      });

      describe("given the queue is not paused", () => {
        beforeEach(() => {
          const mockQueue = {
            repository: {
              defaultBranchRef: {
                target: {
                  commitUrl: "https://commit.url",
                },
              },
              pullRequests: {
                nodes: [
                  {
                    labels: {
                      nodes: [{ id: "123", name: "ready for merge" }],
                    },
                  },
                  {
                    labels: {
                      nodes: [{ id: "123", name: "ready for merge" }],
                    },
                  },
                ],
              },
            },
          };
          //@ts-ignore
          mockGetQueue.mockResolvedValue(mockQueue);
        });

        it("should post a message", async () => {
          await handleStateReported(mockPlatformClient, mockBody, "1234");

          expect(mockPlatformClient.postMergeMessage).toBeCalledWith(
            [
              {
                appliedLabels: ["Ready for merge"],
                headCommitState: "SUCCESS",
                mergeable: "CONFLICTING",
                title: "title",
                url: "https://some.url",
              },
              {
                appliedLabels: ["Ready for merge", "merge train paused"],
                headCommitState: "FAILURE",
                mergeable: "UNKNOWN",
                title: "title2",
                url: "https://some2.url",
              },
            ],
            "No PRs left to merge.",
            "1234"
          );
          expect(mockPlatformClient.postMergeMessage).toBeCalledTimes(1);
        });
      });

      describe("given the queue is paused", () => {
        beforeEach(() => {
          const mockQueue = {
            repository: {
              defaultBranchRef: {
                target: {
                  commitUrl: "https://commit.url",
                },
              },
              pullRequests: {
                nodes: [
                  {
                    labels: {
                      nodes: [
                        { id: "123", name: "ready for merge" },
                        { id: "456", name: "merge train paused" },
                      ],
                    },
                  },
                  {
                    labels: {
                      nodes: [{ id: "123", name: "ready for merge" }],
                    },
                  },
                ],
              },
            },
          };
          //@ts-ignore
          mockGetQueue.mockResolvedValue(mockQueue);
        });

        it("should not post a message", async () => {
          await handleStateReported(mockPlatformClient, mockBody, "1234");

          expect(mockPlatformClient.postMergeMessage).not.toBeCalled();
        });
      });
    });
  });
});
