export enum MergeableState {
  MERGEABLE = "MERGEABLE",
  CONFLICTING = "CONFLICTING",
  UNKNOWN = "UNKNOWN",
}

export type PullRequest = {
  title: string;
  url: string;
  mergeable: MergeableState;
  timelineItems: {
    updatedAt: string;
  };
};

export type Queue = {
  repository: {
    pullRequests: {
      nodes: PullRequest[];
    };
  };
};
