import { CosmosClient } from "@azure/cosmos";
jest.mock("@azure/cosmos");

const mockCosmosClient = CosmosClient as jest.MockedClass<typeof CosmosClient>;

describe("Cosmos DB", () => {
  let connectToCosmos: () => any;
  let readAllItems: (container: typeof mockContainer) => Promise<any[]>;
  let createItem: (
    container: typeof mockContainer,
    url: string
  ) => Promise<void>;
  let deleteItem: (
    container: typeof mockContainer,
    id: string
  ) => Promise<void>;

  const mockContainer = jest.fn();
  const mockDatabase = jest.fn(() => ({
    container: mockContainer,
  }));
  const mockClient = {
    database: mockDatabase,
  };
  const mockConfig = {
    endpoint: "mockEndpoint",
    key: "mockKey",
    databaseId: "mockDatabaseId",
    containerId: "mockContainerId",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockContainer.mockImplementation(() => ({ container: true }));
    jest.mock("./config", () => mockConfig);
    //@ts-ignore I'm not implementing this whole client
    mockCosmosClient.mockImplementation(() => mockClient);
    ({
      connectToCosmos,
      readAllItems,
      createItem,
      deleteItem,
    } = require("./cosmos"));
  });

  describe("given connectToCosmos is called", () => {
    it("should return a container", () => {
      const res = connectToCosmos();
      expect(res).toEqual({ container: true });
      expect(mockDatabase).toBeCalledWith("mockDatabaseId");
      expect(mockContainer).toBeCalledWith("mockContainerId");
    });
  });

  describe("given readAllItems is called", () => {
    it("should return all the items", async () => {
      const resources = [{ url: "url" }];
      const container = {
        items: {
          query: () => ({
            fetchAll: jest.fn().mockResolvedValue({ resources }),
          }),
        },
      };
      //@ts-ignore I'm not implementing this whole container
      const res = await readAllItems(container);
      expect(res).toEqual(resources);
    });
  });

  describe("given createItem is called", () => {
    it("should create an item in the container", async () => {
      const container = {
        items: {
          create: jest.fn(() => ({ resource: { id: "id" } })),
        },
      };

      //@ts-ignore I'm not implementing this whole container
      await createItem(container, "url");
      expect(container.items.create).toBeCalledWith({ url: "url" });
    });
  });

  describe("given deleteItem is called", () => {
    it("should delete an item in the container", async () => {
      const mockDelete = jest.fn();
      const mockItem = jest.fn(() => ({ delete: mockDelete }));
      const container = {
        item: mockItem,
      };

      //@ts-ignore I'm not implementing this whole container
      await deleteItem(container, "id");
      expect(mockItem).toBeCalledWith("id");
      expect(mockDelete).toBeCalled();
    });
  });
});
