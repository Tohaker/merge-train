import {
  createClient,
  sortByDate,
  getPullRequestsReadyForMerge,
  Data,
  MergeableState,
} from "../graphql";

export const getQueue = async () => {
  const client = await createClient();
  const data = await client<Data>(getPullRequestsReadyForMerge, {
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPOSITORY,
  });

  return data;
};

export const hasItems = (queue: Data) => {
  return queue.repository.pullRequests.nodes.length > 0;
};

export const getMergeableItems = (queue: Data) => {
  const { nodes } = queue.repository.pullRequests;

  if (nodes.length) {
    return sortByDate(
      nodes.filter(({ mergeable }) => mergeable === MergeableState.MERGEABLE)
    );
  } else {
    return [];
  }
};
