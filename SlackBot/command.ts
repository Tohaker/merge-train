import {
  AckFn,
  RespondArguments,
  RespondFn,
  SayFn,
  SlashCommand,
} from '@slack/bolt';

enum CommandType {
  ADD = 'add',
  NEXT = 'next',
  LIST = 'list',
  POP = 'pop',
  CLEAR = 'clear',
}

type Props = {
  command: SlashCommand;
  respond: RespondFn;
  ack: AckFn<string | RespondArguments>;
  say: SayFn;
};

export const parseCommand = async ({ command, respond, ack, say }: Props) => {
  const { text } = command;
  const commandType = text.split(' ')[0];
  const url = text.split(' ')[1];

  await ack();

  if ((<any>Object).values(CommandType).includes(commandType)) {
    await respond({
      response_type: 'ephemeral',
      text:
        "Sorry, this command is invalid. Valid commands are 'add, next, list, pop, clear'",
    });

    return;
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
