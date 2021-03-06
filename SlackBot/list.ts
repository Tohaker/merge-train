import { getQueue } from "../graphql/queue";
import sortByDate from "../graphql/sortByDate";

export const getList = async (): Promise<string[]> => {
  try {
    const data = await getQueue();

    const labeledEvents = sortByDate(data.repository.pullRequests.nodes);

    const formattedList = labeledEvents.reduce((acc, event) => {
      const line = `<${event.url}|${event.title}>`;
      return acc.concat(line);
    }, []);

    return formattedList;
  } catch (e) {
    console.error("Couldn't get data from Github: ", e);
    return [];
  }
};
