import { HttpRequest } from "@azure/functions";
import {
  PullRequestEvent,
  PullRequest,
} from "@octokit/webhooks-definitions/schema";

export interface Request extends HttpRequest {
  body: PullRequestEvent;
}

export type PanelData = {
  footer?: string;
  headline: string;
  pull_request: PullRequest;
  tag: string;
  changed?: boolean;
};

export type SlackUser = {
  id: string;
  name: string;
  real_name: string;
  profile: {
    title: string;
    display_name: string;
  };
};
