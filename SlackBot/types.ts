import { KnownBlock } from "@slack/bolt";

export type Body = {
  command: string;
  response_url: string;
  text: string;
};

export type RespondProps = {
  blocks?: KnownBlock[];
  text?: string;
  response_type?: string;
};

type PullRequest = {
  title: string;
  url: string;
  timelineItems: {
    updatedAt: string;
  };
};

export type Data = {
  repository: {
    pullRequests: {
      nodes: PullRequest[];
    };
  };
};
