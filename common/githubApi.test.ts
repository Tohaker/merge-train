describe("Github API", () => {
  let getAccessTokens: (jwt: string) => Promise<void>;

  const mockGetData = jest.fn().mockResolvedValue({ data: true });
  const mockFetch = jest.fn().mockResolvedValue({ json: mockGetData });

  beforeEach(() => {
    jest.mock("node-fetch", () => mockFetch);
    process.env.GITHUB_INSTALLATION_ID = "42";

    getAccessTokens = require("./githubApi").getAccessTokens;
  });

  describe("given the GITHUB_HOSTNAME env variable is present", () => {
    beforeEach(() => {
      process.env.GITHUB_HOSTNAME = "https://some.url";
    });

    it("should call fetch with the correct parameters", async () => {
      await getAccessTokens("jwt");

      expect(mockFetch).toBeCalledWith(
        "https://some.url/api/v3/app/installations/42/access_tokens",
        {
          method: "POST",
          headers: {
            accept: "application/vnd.github.machine-man-preview+json",
            Authorization: "Bearer jwt",
          },
        }
      );
    });
  });

  describe("given the GITHUB_HOSTNAME env variable is not present", () => {
    beforeEach(() => {
      process.env.GITHUB_HOSTNAME = "";
    });

    it("should call fetch with the correct parameters", async () => {
      await getAccessTokens("jwt");

      expect(mockFetch).toBeCalledWith(
        "https://api.github.com/app/installations/42/access_tokens",
        {
          method: "POST",
          headers: {
            accept: "application/vnd.github.v3+json",
            Authorization: "Bearer jwt",
          },
        }
      );
    });
  });
});
