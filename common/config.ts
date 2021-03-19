import { PullRequestMergeMethod } from "@octokit/graphql-schema";
// Edit this file if your slack channels or github branches have different names

export enum Branch {
  DEFAULT = "master",
}

export enum ChannelName {
  MERGE = "merge",
  REVIEWS = "reviews",
}

export enum Label {
  READY_FOR_MERGE = "Ready for merge",
  MERGE_TRAIN_PAUSED = "merge train paused",
}

// Specify branch regexes in the order they should be considered.
export const mergeMethods: {
  branch: RegExp;
  mergeMethod: PullRequestMergeMethod;
}[] = [
  {
    branch: new RegExp("^release/"),
    mergeMethod: "REBASE",
  },
  {
    branch: new RegExp("\\S*"),
    mergeMethod: "SQUASH",
  },
];

export const icon_emoji = ":steam_locomotive:";
