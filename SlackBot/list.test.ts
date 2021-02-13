describe("List", () => {
  let getList: () => Promise<string[]>;

  const mockRequest = jest.fn();
  const mockCreateClient = jest.fn();
  mockCreateClient.mockResolvedValue({ request: mockRequest });

  const mockData = {
    repository: {
      pullRequests: {
        nodes: [
          { title: "title1", url: "url1", timelineItems: { updatedAt: 2000 } },
          { title: "title2", url: "url2", timelineItems: { updatedAt: 1000 } },
        ],
      },
    },
  };

  beforeEach(() => {
    jest.mock("./graphql", () => ({
      createClient: mockCreateClient,
      getPullRequestsReadyForMerge: "query",
    }));

    getList = require("./list").getList;
  });

  describe("given the data request is successful", () => {
    beforeEach(() => {
      mockRequest.mockResolvedValue(mockData);
    });

    it("should return a list of PRs in ascending date order", async () => {
      process.env.GITHUB_OWNER = "owner";
      process.env.GITHUB_REPOSITORY = "repo";

      const list = await getList();

      expect(mockRequest).toBeCalledWith("query", {
        owner: "owner",
        repo: "repo",
      });
      expect(list).toEqual(["<url2|title2>", "<url1|title1>"]);
    });
  });

  describe("given the data request is unsuccessful", () => {
    beforeEach(() => {
      mockRequest.mockRejectedValue(false);
    });

    it("should return an empty list", async () => {
      process.env.GITHUB_OWNER = "owner";
      process.env.GITHUB_REPOSITORY = "repo";

      const list = await getList();

      expect(mockRequest).toBeCalledWith("query", {
        owner: "owner",
        repo: "repo",
      });
      expect(list).toEqual([]);
    });
  });
});
