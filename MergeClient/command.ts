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
  command: string;
  respond: (text: string, ephemeral?: boolean) => Promise<any>;
};

const createMarkdownList = (items: any[]) =>
  items.reduce((prev, current, i) => prev + `${i + 1}. ${current}\n`, "");

export const parseCommand = async ({ command, respond }: Props) => {
  console.log(`Command: ${command}`);

  const commandType = command.split(" ")[0];
  if (!(<any>Object).values(CommandType).includes(commandType)) {
    await respond(invalidCommand, true);

    return;
  }

  const list = await getList();

  switch (commandType) {
    case CommandType.NEXT:
      if (list.length) await respond(nextSuccess(list[0]));
      else await respond(listEmpty);
      break;
    case CommandType.LIST:
      const isPublic = command.split(" ")[1] === "public";

      if (list.length)
        await respond(listSuccess(createMarkdownList(list)), !isPublic);
      else await respond(listEmpty, !isPublic);
      break;
    case CommandType.PAUSE:
      if (await pauseAll()) await respond(pauseSuccess);
      else await respond(pauseFailure);
      break;
    case CommandType.RESUME:
      if (await resumeAll()) await respond(resumeSuccess);
      else await respond(resumeFailure);
      break;
    case CommandType.HELP:
      await respond(helpText, true);
      break;
    default:
      break;
  }
};
