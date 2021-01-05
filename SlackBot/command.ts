import { Context } from '@azure/functions';
import { RespondFn, SayFn, SlashCommand } from '@slack/bolt';
import {
  connectToCosmos,
  createItem,
  deleteItem,
  readAllItems,
} from './cosmos';
import {
  helpText,
  invalidCommand,
  addSuccess,
  addError,
  nextSuccess,
  listEmpty,
  listSuccess,
  popSuccess,
  popError,
  clearError,
  clearSuccess,
} from './constants';

enum CommandType {
  ADD = 'add',
  NEXT = 'next',
  LIST = 'list',
  POP = 'pop',
  CLEAR = 'clear',
  HELP = 'help',
}

type Props = {
  command: SlashCommand;
  context: Context;
  respond: RespondFn;
  say: SayFn;
};

const createMarkdownList = (items: any[]) =>
  items.reduce((prev, current, i) => prev + `${i + 1}. ${current.url}\n`, '');

export const parseCommand = async ({
  command,
  context,
  respond,
  say,
}: Props) => {
  const sendEphemeralMessage = (text: string) =>
    respond({ response_type: 'ephemeral', mrkdwn: true, text });

  const sendMessage = (text: string) =>
    say({
      text: '',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text,
          },
        },
      ],
    });

  const { text } = command;
  const commandType = text.split(' ')[0].toLowerCase();
  const url = text.split(' ')[1];

  context.log(`Command: ${commandType}`);
  if (!(<any>Object).values(CommandType).includes(commandType)) {
    await sendEphemeralMessage(invalidCommand);

    return;
  }

  const container = connectToCosmos();
  const items = await readAllItems(container);

  switch (commandType) {
    case CommandType.ADD:
      try {
        await createItem(container, url);
        await sendMessage(addSuccess(url));
      } catch (e) {
        await sendEphemeralMessage(addError);
      }
      break;
    case CommandType.NEXT:
      await sendMessage(nextSuccess(items[0].url));
      break;
    case CommandType.LIST:
      if (items.length)
        await sendMessage(listSuccess(createMarkdownList(items)));
      else await sendMessage(listEmpty);
      break;
    case CommandType.POP:
      try {
        const next = items[0];
        await deleteItem(container, next.id);
        await sendMessage(popSuccess(next.url));
      } catch (e) {
        await sendEphemeralMessage(popError(items[0].url));
      }
      break;
    case CommandType.CLEAR:
      try {
        await Promise.all(
          items.map(async ({ id }) => await deleteItem(container, id))
        );
        await sendMessage(clearSuccess(createMarkdownList(items)));
      } catch (e) {
        await sendEphemeralMessage(clearError);
      }
      break;
    case CommandType.HELP:
      await sendEphemeralMessage(helpText);
      break;
    default:
      break;
  }
};
