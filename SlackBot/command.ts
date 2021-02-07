import { Context } from '@azure/functions';
import {
  connectToCosmos,
  createItem,
  deleteItem,
  readAllItems,
} from '../common/cosmos';
import {
  helpText,
  invalidCommand,
  addSuccess,
  addError,
  nextSuccess,
  listEmpty,
  listSuccess,
  unshiftSuccess,
  unshiftError,
  clearError,
  clearSuccess,
} from './constants';
import { RespondProps } from './types';

enum CommandType {
  ADD = 'add',
  NEXT = 'next',
  LIST = 'list',
  UNSHIFT = 'unshift',
  CLEAR = 'clear',
  HELP = 'help',
}

type Props = {
  text: string;
  context: Context;
  respond: (args: RespondProps) => Promise<any>;
};

const createMarkdownList = (items: any[]) =>
  items.reduce((prev, current, i) => prev + `${i + 1}. ${current.url}\n`, '');

export const parseCommand = async ({ text, context, respond }: Props) => {
  const sendEphemeralMessage = (text: string) =>
    respond({ response_type: 'ephemeral', text });

  const sendMessage = (text: string) =>
    respond({
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
      const isPublic = text.split(' ')[1] === 'public';
      const send = isPublic ? sendMessage : sendEphemeralMessage;

      if (items.length) await send(listSuccess(createMarkdownList(items)));
      else await send(listEmpty);
      break;
    case CommandType.UNSHIFT:
      try {
        const next = items[0];
        await deleteItem(container, next.id);
        await sendMessage(unshiftSuccess(next.url));
      } catch (e) {
        await sendEphemeralMessage(unshiftError(items[0].url));
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
