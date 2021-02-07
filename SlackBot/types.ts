import { KnownBlock } from '@slack/bolt';

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
