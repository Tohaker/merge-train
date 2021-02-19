import {
  createClient,
  getPullRequestsReadyForMerge,
  Data,
  sortByDate,
} from "../graphql";

export const getList = async (): Promise<string[]> => {
  try {
    const client = await createClient();
    const data = await client<Data>(getPullRequestsReadyForMerge, {
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPOSITORY,
    });

    const labeledEvents = sortByDate(data.repository.pullRequests.nodes);

    const formattedList = labeledEvents.reduce((acc, event) => {
      const line = `<${event.url}|${event.title}>`;
      return acc.concat(line);
    }, []);

    return formattedList;
  } catch (e) {
    console.log("Couldn't get data from Github: ", e);
    return [];
  }
};
