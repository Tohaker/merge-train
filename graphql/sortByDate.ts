import { PullRequest } from "@octokit/graphql-schema";

export default (pullRequests: PullRequest[]) =>
  pullRequests.sort(
    (a, b) =>
      new Date(a.timelineItems.updatedAt).valueOf() -
      new Date(b.timelineItems.updatedAt).valueOf()
  );
