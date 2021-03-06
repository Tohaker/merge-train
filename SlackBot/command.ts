import { RespondFn } from "@slack/bolt";
import { icon_emoji } from "../common/config";
import {
  helpText,
  invalidCommand,
  nextSuccess,
  listEmpty,
  listSuccess,
  pauseSuccess,
  pauseFailure,
  resumeSuccess,
  resumeFailure,
} from "./constants";
import { getList } from "./list";
import { pauseAll, resumeAll } from "./pause";

enum CommandType {
  NEXT = "next",
  LIST = "list",
  PAUSE = "pause",
  RESUME = "resume",
  HELP = "help",
}

type Props = {
  text: string;
  respond: RespondFn;
};

const createMarkdownList = (items: any[]) =>
  items.reduce((prev, current, i) => prev + `${i + 1}. ${current}\n`, "");

export const parseCommand = async ({ text, respond }: Props) => {
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

  console.log(`Command: ${commandType}`);
  if (!(<any>Object).values(CommandType).includes(commandType)) {
    await sendEphemeralMessage(invalidCommand);

    return;
  }

  const list = await getList();

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
    case CommandType.PAUSE:
      if (await pauseAll()) await sendMessage(pauseSuccess);
      else await sendMessage(pauseFailure);
    case CommandType.RESUME:
      if (await resumeAll()) await sendMessage(resumeSuccess);
      else await sendMessage(resumeFailure);
    case CommandType.HELP:
      await sendEphemeralMessage(helpText);
      break;
    default:
      break;
  }
};
