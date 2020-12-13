import { Context } from '@azure/functions';
import { RespondFn, SayFn, SlashCommand } from '@slack/bolt';
import {
  connectToCosmos,
  createItem,
  deleteItem,
  readAllItems,
} from './cosmos';

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

const helpText =
  'How to use the Merge Train Slack Bot: \
* `/merge add <github URL>` - Add a URL to the merge train. \
* `/merge next` - Display the next URL in the list. This will not remove it from the list. \
* `/merge list` - Display all URLs in the list, in the order they were added. \
* `/merge pop` - Remove the last URL from the list and display it. \
* `/merge clear` - Clear the entire list. The list will be displayed before it clears in case this action is performed accidentally.';

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
    await sendEphemeralMessage(
      'Sorry, this command is invalid. Valid commands are `add` | `next` | `list`| `pop` | `clear`'
    );

    return;
  }

  const container = connectToCosmos();
  const items = await readAllItems(container);

  switch (commandType) {
    case CommandType.ADD:
      try {
        await createItem(container, url);
        await sendMessage(`Added ${url} to list.`);
      } catch (e) {
        await sendEphemeralMessage(
          "Sorry, this couldn't be added to the list. Tell Miles and maybe he can work out why."
        );
      }
      break;
    case CommandType.NEXT:
      await sendMessage(`Next PR: ${items[0].url}`);
      break;
    case CommandType.LIST:
      await sendMessage(createMarkdownList(items));
      break;
    case CommandType.POP:
      try {
        const next = items[0];
        await deleteItem(container, next.id);
        await sendMessage(
          `Next PR: ${next.url} \nThis has now been removed from the list.`
        );
      } catch (e) {
        await sendEphemeralMessage(
          `Sorry, this couldn't be removed from the list. Tell Miles and maybe he can work out why.\n Here's what I found anyway: ${items[0].url}`
        );
      }
      break;
    case CommandType.CLEAR:
      try {
        await Promise.all(
          items.map(async ({ id }) => await deleteItem(container, id))
        );
        await sendMessage(
          `List has been purged. Here's what was in it:\n${createMarkdownList(
            items
          )}`
        );
      } catch (e) {
        await sendEphemeralMessage(
          "Sorry, the list couldn't be cleared. Tell Miles and maybe he can work out why."
        );
      }
      break;
    case CommandType.HELP:
      await sendEphemeralMessage(helpText);
      break;
    default:
      break;
  }
};
