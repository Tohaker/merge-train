import {
  createClient,
  sortByDate,
  getPullRequestsReadyForMerge,
  Queue,
} from ".";
import { Label } from "../common/config";

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
      nodes.filter(
        ({ mergeable, commits, labels }) =>
          mergeable === "MERGEABLE" &&
          commits?.nodes[0].commit.status.state === "SUCCESS" &&
          !labels?.nodes.some(({ name }) => name === Label.MERGE_TRAIN_PAUSED)
      )
    );
  } else {
    return [];
  }
};
