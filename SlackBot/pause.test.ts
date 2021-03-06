describe("Pause functions", () => {
  let pauseAll, resumeAll;

  const mockRequest = jest.fn();
  //@ts-ignore
  const mockCreateClient = jest.fn().mockResolvedValue(mockRequest);

  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    process.env.GITHUB_OWNER = "owner";
    process.env.GITHUB_REPOSITORY = "repo";
    jest.clearAllMocks();

    jest.mock("../graphql", () => ({
      addLabelToPullRequest: "add label",
      getLabelsAndPullRequests: "get labels",
      createClient: mockCreateClient,
      Queue: jest.requireActual("../graphql").Queue,
      removeLabelFromPullRequest: "remove label",
    }));
    jest.mock("../common/config", () => ({
      Label: {
        MERGE_TRAIN_PAUSED: "merge train paused",
        READY_FOR_MERGE: "ready for merge",
      },
    }));

    ({ pauseAll, resumeAll } = require("./pause"));
  });

  describe("given pauseAll is called", () => {
    describe("given no pull requests are found", () => {
      beforeEach(() => {
        mockRequest.mockResolvedValue({
          repository: {
            labels: {
              nodes: [{ id: "123" }],
            },
            pullRequests: null,
          },
        });
      });

      it("should return false", async () => {
        const result = await pauseAll();

        expect(mockRequest).toBeCalledWith("get labels", {
          owner: "owner",
          repo: "repo",
          labelToApply: "merge train paused",
          labelsOnPullRequests: "ready for merge",
        });

        expect(result).toBe(false);
      });
    });

    describe("given no labels are found", () => {
      beforeEach(() => {
        mockRequest.mockResolvedValue({
          repository: {
            labels: null,
            pullRequests: {
              nodes: [{ id: "456" }],
            },
          },
        });
      });

      it("should return false", async () => {
        const result = await pauseAll();

        expect(mockRequest).toBeCalledWith("get labels", {
          owner: "owner",
          repo: "repo",
          labelToApply: "merge train paused",
          labelsOnPullRequests: "ready for merge",
        });

        expect(result).toBe(false);
      });
    });

    describe("given the GraphQL request fails", () => {
      beforeEach(() => {
        mockRequest
          .mockResolvedValueOnce({
            repository: {
              labels: {
                nodes: [{ id: "123" }],
              },
              pullRequests: {
                nodes: [
                  { id: "456", title: "title1" },
                  { id: "789", title: "title2" },
                ],
              },
            },
          })
          .mockResolvedValueOnce({ data: true })
          .mockRejectedValueOnce({ data: false });
      });

      it("should return false", async () => {
        const result = await pauseAll();

        expect(mockRequest).toBeCalledWith("get labels", {
          owner: "owner",
          repo: "repo",
          labelToApply: "merge train paused",
          labelsOnPullRequests: "ready for merge",
        });

        expect(result).toBe(false);
      });
    });

    describe("given pull requests and labels are found", () => {
      beforeEach(() => {
        mockRequest.mockResolvedValue({
          repository: {
            labels: {
              nodes: [{ id: "123" }],
            },
            pullRequests: {
              nodes: [
                { id: "456", title: "title1" },
                { id: "789", title: "title2" },
              ],
            },
          },
        });
      });

      it("should add labels and return true", async () => {
        const result = await pauseAll();

        expect(mockRequest).toBeCalledWith("get labels", {
          owner: "owner",
          repo: "repo",
          labelToApply: "merge train paused",
          labelsOnPullRequests: "ready for merge",
        });

        expect(mockRequest).toBeCalledWith("add label", {
          labelId: "123",
          pullRequestId: "456",
        });

        expect(mockRequest).toBeCalledWith("add label", {
          labelId: "123",
          pullRequestId: "789",
        });

        expect(result).toBe(true);
      });
    });
  });

  describe("given resumeAll is called", () => {
    describe("given no pull requests are found", () => {
      beforeEach(() => {
        mockRequest.mockResolvedValue({
          repository: {
            labels: {
              nodes: [{ id: "123" }],
            },
            pullRequests: null,
          },
        });
      });

      it("should return false", async () => {
        const result = await resumeAll();

        expect(mockRequest).toBeCalledWith("get labels", {
          owner: "owner",
          repo: "repo",
          labelToApply: "merge train paused",
          labelsOnPullRequests: "merge train paused",
        });

        expect(result).toBe(false);
      });
    });

    describe("given no labels are found", () => {
      beforeEach(() => {
        mockRequest.mockResolvedValue({
          repository: {
            labels: null,
            pullRequests: {
              nodes: [{ id: "456" }],
            },
          },
        });
      });

      it("should return false", async () => {
        const result = await resumeAll();

        expect(mockRequest).toBeCalledWith("get labels", {
          owner: "owner",
          repo: "repo",
          labelToApply: "merge train paused",
          labelsOnPullRequests: "merge train paused",
        });

        expect(result).toBe(false);
      });
    });

    describe("given the GraphQL request fails", () => {
      beforeEach(() => {
        mockRequest
          .mockResolvedValueOnce({
            repository: {
              labels: {
                nodes: [{ id: "123" }],
              },
              pullRequests: {
                nodes: [
                  { id: "456", title: "title1" },
                  { id: "789", title: "title2" },
                ],
              },
            },
          })
          .mockResolvedValueOnce({ data: true })
          .mockRejectedValueOnce({ data: false });
      });

      it("should return false", async () => {
        const result = await resumeAll();

        expect(mockRequest).toBeCalledWith("get labels", {
          owner: "owner",
          repo: "repo",
          labelToApply: "merge train paused",
          labelsOnPullRequests: "merge train paused",
        });

        expect(result).toBe(false);
      });
    });

    describe("given pull requests and labels are found", () => {
      beforeEach(() => {
        mockRequest.mockResolvedValue({
          repository: {
            labels: {
              nodes: [{ id: "123" }],
            },
            pullRequests: {
              nodes: [
                { id: "456", title: "title1" },
                { id: "789", title: "title2" },
              ],
            },
          },
        });
      });

      it("should add labels and return true", async () => {
        const result = await resumeAll();

        expect(mockRequest).toBeCalledWith("get labels", {
          owner: "owner",
          repo: "repo",
          labelToApply: "merge train paused",
          labelsOnPullRequests: "merge train paused",
        });

        expect(mockRequest).toBeCalledWith("remove label", {
          labelId: "123",
          pullRequestId: "456",
        });

        expect(mockRequest).toBeCalledWith("remove label", {
          labelId: "123",
          pullRequestId: "789",
        });

        expect(result).toBe(true);
      });
    });
  });
});
