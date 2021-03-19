import {
  MergeableState,
  PullRequest,
  StatusState,
} from "@octokit/graphql-schema";
import {
  createClient,
  sortByDate,
  getPullRequestsReadyForMerge,
  Queue,
} from ".";
import { Label } from "../common/config";

export type MergeableItemState = {
  appliedLabels: string[];
  headCommitState: StatusState;
  mergeable: MergeableState;
  title: string;
  url: string;
};

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

const getMergeableState = (node: PullRequest): MergeableItemState => {
  const { mergeable, commits, labels, url, title } = node;

  return {
    appliedLabels: labels?.nodes?.map(({ name }) => name),
    headCommitState: commits?.nodes[0].commit.status.state,
    mergeable,
    title,
    url,
  };
};

export const isMergeable = (state: MergeableItemState) => {
  const { mergeable, headCommitState, appliedLabels } = state;

  console.log("Mergeable - ", mergeable);
  console.log("Last commit state - ", headCommitState);
  console.log("Labels - ", JSON.stringify(appliedLabels));

  return (
    mergeable === "MERGEABLE" &&
    headCommitState === "SUCCESS" &&
    !appliedLabels?.some((name) => name === Label.MERGE_TRAIN_PAUSED)
  );
};

export const getMergeableItemsState = (queue: Queue) => {
  const { nodes } = queue.repository.pullRequests;

  if (nodes.length) {
    return sortByDate(nodes).map(getMergeableState);
  } else {
    return [];
  }
};
