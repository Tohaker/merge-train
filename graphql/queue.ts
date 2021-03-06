import { PullRequest } from "@octokit/graphql-schema";
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
    label: Label.READY_FOR_MERGE,
  });

  return data;
};

export const getItems = (queue: Queue) => {
  return queue.repository.pullRequests.nodes;
};

export const hasItems = (queue: Queue) => {
  return getItems(queue).length > 0;
};

const isMergeable = (node: PullRequest) => {
  const { mergeable, commits, labels } = node;

  console.log("Mergeable - ", mergeable);
  console.log("Last commit state - ", commits?.nodes[0].commit.status.state);
  console.log("Labels - ", JSON.stringify(labels?.nodes));

  return (
    mergeable === "MERGEABLE" &&
    commits?.nodes[0].commit.status.state === "SUCCESS" &&
    !labels?.nodes.some(({ name }) => name === Label.MERGE_TRAIN_PAUSED)
  );
};

export const getMergeableItems = (queue: Queue) => {
  const { nodes } = queue.repository.pullRequests;

  if (nodes.length) {
    return sortByDate(nodes.filter((node) => isMergeable(node)));
  } else {
    return [];
  }
};
