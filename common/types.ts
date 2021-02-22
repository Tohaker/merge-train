export type Channel = {
  id: string;
  name: string;
};

export type Conversation = {
  ok: boolean;
  channels: Channel[];
};
