import { Context } from "@azure/functions";
import { RespondFn } from "@slack/bolt";
import { icon_emoji } from "../common/config";
import {
  helpText,
  invalidCommand,
  nextSuccess,
  listEmpty,
  listSuccess,
} from "./constants";
import { getList } from "./list";

enum CommandType {
  NEXT = "next",
  LIST = "list",
  HELP = "help",
}

type Props = {
  text: string;
  context: Context;
  respond: RespondFn;
};

const createMarkdownList = (items: any[]) =>
  items.reduce((prev, current, i) => prev + `${i + 1}. ${current}\n`, "");

export const parseCommand = async ({ text, context, respond }: Props) => {
  const sendEphemeralMessage = (text: string) =>
    respond({ icon_emoji, response_type: "ephemeral", text });

  const sendMessage = (text: string) =>
    respond({
      icon_emoji,
      response_type: "in_channel",
      text,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text,
          },
        },
      ],
    });

  const commandType = text.split(" ")[0].toLowerCase();

  context.log(`Command: ${commandType}`);
  if (!(<any>Object).values(CommandType).includes(commandType)) {
    await sendEphemeralMessage(invalidCommand);

    return;
  }

  const list = await getList(context);

  switch (commandType) {
    case CommandType.NEXT:
      if (list.length) await sendMessage(nextSuccess(list[0]));
      else await sendMessage(listEmpty);
      break;
    case CommandType.LIST:
      const isPublic = text.split(" ")[1] === "public";
      const send = isPublic ? sendMessage : sendEphemeralMessage;

      if (list.length) await send(listSuccess(createMarkdownList(list)));
      else await send(listEmpty);
      break;
    case CommandType.HELP:
      await sendEphemeralMessage(helpText);
      break;
    default:
      break;
  }
};
