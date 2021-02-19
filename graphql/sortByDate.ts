import { PullRequest } from "./types";

export default (pullRequests: PullRequest[]) =>
  pullRequests.sort(
    (a, b) =>
      new Date(a.timelineItems.updatedAt).valueOf() -
      new Date(b.timelineItems.updatedAt).valueOf()
  );
