export type PullRequest = {
  html_url: string;
  title: string;
  created_at: string;
  updated_at: string;
  requested_reviewers: User[];
};

export type Label = {
  name: string;
};

export type User = {
  login: string;
  avatar_url: string;
};

export type RequestedTeam = {
  name: "string";
};

export type PanelData = {
  footer: string;
  headline: string;
  pull_request: PullRequest;
  tag: string;
  changed?: boolean;
};

export type Channel = {
  id: string;
  name: string;
};

export type Conversation = {
  ok: boolean;
  channels: Channel[];
};

type SlackUser = {
  id: string;
  name: string;
  real_name: string;
  profile: {
    title: string;
    display_name: string;
  };
};

export type SlackUserList = {
  ok: boolean;
  members: SlackUser[];
};

export type RequestBody = {
  action: string;
  pull_request: PullRequest;
  label: Label;
  sender: User;
  requested_team?: RequestedTeam;
};

export enum Action {
  LABELED = "labeled",
  UNLABELED = "unlabeled",
  REVIEW_REQUESTED = "review_requested",
}
