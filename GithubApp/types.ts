import { HttpRequest } from "@azure/functions";
import {
  PullRequestEvent,
  StatusEvent,
  PullRequest,
} from "@octokit/webhooks-types";

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
  creator?: string;
  changed?: boolean;
  assigned?: string[];
};
