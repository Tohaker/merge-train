import { createClient, getPullRequestsReadyForMerge } from "./graphql";
import { Data } from "./types";

export const getList = async (): Promise<string[]> => {
  try {
    const client = await createClient();
    const data: Data = await client.request(getPullRequestsReadyForMerge, {
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPOSITORY,
    });

    const labeledEvents = data.repository.pullRequests.nodes
      .map(({ title, url, timelineItems }) => ({
        title,
        url,
        updatedAt: new Date(timelineItems.updatedAt),
      }))
      .sort((a, b) => a.updatedAt.valueOf() - b.updatedAt.valueOf());

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
