import { getQueue } from "../graphql/queue";
import sortByDate from "../graphql/sortByDate";

const formatLink = (url: string, text: string) => {
  if (process.env.CLIENT_PLATFORM === "slack") {
    return `<${url}|${text}>`;
  } else {
    return `[${text}](${url})`;
  }
};

export const getList = async (): Promise<string[]> => {
  try {
    const data = await getQueue();

    const labeledEvents = sortByDate(data.repository.pullRequests.nodes);

    const formattedList = labeledEvents.reduce((acc, event) => {
      return acc.concat(formatLink(event.url, event.title));
    }, []);

    return formattedList;
  } catch (e) {
    console.error("Couldn't get data from Github: ", e);
    return [];
  }
};
