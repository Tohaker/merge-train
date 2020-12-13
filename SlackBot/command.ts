import { AckFn, RespondArguments, SayFn, SlashCommand } from '@slack/bolt';

enum CommandType {
  ADD = 'add',
  NEXT = 'next',
  LIST = 'list',
  POP = 'pop',
  CLEAR = 'clear',
}

type Props = {
  command: SlashCommand;
  ack: AckFn<string | RespondArguments>;
  say: SayFn;
};

export const parseCommand = async ({ command, ack, say }: Props) => {
  const { text } = command;
  const commandType = text.split(' ')[0];
  const url = text.split(' ')[1];

  if ((<any>Object).values(CommandType).includes(commandType)) {
    await ack({
      response_type: 'ephemeral',
      text:
        "Sorry, this command is invalid. Valid commands are 'add, next, list, pop, clear'",
    });
  } else {
    await ack();
  }

  switch (commandType) {
    case CommandType.ADD:
      await say({
        text: '',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Added ${url} to list.`,
            },
          },
        ],
      });
      break;
    case CommandType.NEXT:
      await say({
        text: '',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Next value requested.`,
            },
          },
        ],
      });
      break;
    case CommandType.LIST:
      await say({
        text: '',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Full list requested.`,
            },
          },
        ],
      });
      break;
    case CommandType.POP:
      await say({
        text: '',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Pop requested.`,
            },
          },
        ],
      });
      break;
    case CommandType.CLEAR:
      await say({
        text: '',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `List clear requested.`,
            },
          },
        ],
      });
      break;
    default:
      break;
  }
};
