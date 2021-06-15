import { HttpRequest } from "@azure/functions";
import {
  PullRequestEvent,
  StatusEvent,
  PullRequest,
  User,
  Team,
} from "@octokit/webhooks-types";
import { MergeableItemState } from "../graphql/queue";

export interface Request extends HttpRequest {
  body: PullRequestEvent | StatusEvent;
}

export type SlackUser = {
  id: string;
  name: string;
  real_name: string;
  profile: {
    title: string;
    display_name: string;
  };
};

export type CardProps = {
  headline: string;
  pullRequest: PullRequest;
  creator: string;
  changed?: boolean;
  assigned?: string[];
};

export type Client = {
  postReviewMessage: (cardProps: CardProps, channel?: string) => Promise<void>;
  postMergeMessage: (
    states: MergeableItemState[],
    summary: string,
    channel?: string
  ) => Promise<void>;
  postSimpleMessage: (text: string, channel?: string) => Promise<void>;
  formatAssignees: (reviewers: (User | Team)[]) => Promise<string[]>;
};
