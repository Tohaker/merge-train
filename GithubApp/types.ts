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

export type PanelData = {
  footer: string;
  headline: string;
  pull_request: PullRequest;
  sender: User;
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

export type RequestBody = {
  action: string;
  pull_request: PullRequest;
  label: Label;
  sender: User;
};

export enum Action {
  LABELED = 'labeled',
  UNLABELED = 'unlabeled',
  REVIEW_REQUESTED = 'review_requested',
}
