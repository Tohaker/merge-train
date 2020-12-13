import { Container, CosmosClient } from '@azure/cosmos';
import config from './config';

export const connectToCosmos = () => {
  const { endpoint, key, databaseId, containerId } = config;

  const client = new CosmosClient({
    endpoint,
    key,
  });

  const container = client.database(databaseId).container(containerId);

  return container;
};

export const readAllItems = async (container: Container) => {
  const querySpec = {
    query: 'SELECT * from c',
  };

  const { resources: items } = await container.items
    .query(querySpec)
    .fetchAll();

  return items;
};

export const createItem = async (container: Container, url: string) => {
  const newItem = { url };
  const { resource: createdItem } = await container.items.create(newItem);
  console.log(`Created new item: ${createdItem.id}`);
};

export const deleteItem = async (container: Container, id: string) => {
  await container.item(id).delete();
  console.log(`Deleted item with id: ${id}`);
};
