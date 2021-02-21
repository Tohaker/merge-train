import {
  createClient,
  sortByDate,
  getPullRequestsReadyForMerge,
  Queue,
  MergeableState,
} from ".";

export const getQueue = async () => {
  const client = await createClient();
  const data = await client<Queue>(getPullRequestsReadyForMerge, {
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPOSITORY,
  });

  return data;
};

export const getItems = (queue: Queue) => {
  return queue.repository.pullRequests.nodes;
};

export const hasItems = (queue: Queue) => {
  return getItems(queue).length > 0;
};

export const getMergeableItems = (queue: Queue) => {
  const { nodes } = queue.repository.pullRequests;

  if (nodes.length) {
    return sortByDate(
      nodes.filter(({ mergeable }) => mergeable === MergeableState.MERGEABLE)
    );
  } else {
    return [];
  }
};
