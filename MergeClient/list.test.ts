import { getQueue } from "../graphql/queue";
import { getList } from "./list";

jest.mock("../graphql/queue");

const mockGetQueue = getQueue as jest.MockedFunction<typeof getQueue>;

jest.spyOn(console, "error").mockImplementation(() => {});

describe("List", () => {
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

  describe("given the client is slack", () => {
    beforeEach(() => {
      process.env.CLIENT_PLATFORM = "slack";
    });

    describe("given the data request is successful", () => {
      beforeEach(() => {
        //@ts-ignore
        mockGetQueue.mockResolvedValue(mockData);
      });

      it("should return a list of PRs in ascending date order", async () => {
        const list = await getList();

        expect(list).toEqual(["<url2|title2>", "<url1|title1>"]);
      });
    });
  });

  describe("given the client is teams", () => {
    beforeEach(() => {
      process.env.CLIENT_PLATFORM = "teams";
    });

    describe("given the data request is successful", () => {
      beforeEach(() => {
        //@ts-ignore
        mockGetQueue.mockResolvedValue(mockData);
      });

      it("should return a list of PRs in ascending date order", async () => {
        const list = await getList();

        expect(list).toEqual(["[title2](url2)", "[title1](url1)"]);
      });
    });
  });

  describe("given the data request is unsuccessful", () => {
    beforeEach(() => {
      mockGetQueue.mockRejectedValue(false);
    });

    it("should return an empty list", async () => {
      const list = await getList();

      expect(list).toEqual([]);
    });
  });
});
