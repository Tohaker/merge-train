import {
  addLabelToPullRequest,
  createClient,
  getLabelsAndPullRequests,
  Queue,
  removeLabelFromPullRequest,
} from "../graphql";
import { Label } from "../common/config";

const changeLabelsOnPullRequests = async (
  query: string,
  labelsOnPullRequests: Label
): Promise<boolean> => {
  try {
    const client = await createClient();
    const data = await client<Queue>(getLabelsAndPullRequests, {
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPOSITORY,
      labelToApply: Label.MERGE_TRAIN_PAUSED,
      labelsOnPullRequests,
    });

    const labelId = data.repository.labels?.nodes?.[0].id;
    const pullRequests = data.repository.pullRequests?.nodes || [];

    if (pullRequests.length && labelId) {
      await Promise.all(
        pullRequests.map(({ id, title }) => {
          console.log(`Changing label on ${title}`);
          return client(query, { labelId, pullRequestId: id });
        })
      );
      return true;
    } else {
      return false;
    }

    pullRequests;
  } catch (e) {
    console.error("Error from Github: ", e);
    return false;
  }
};

export const pauseAll = () =>
  changeLabelsOnPullRequests(addLabelToPullRequest, Label.READY_FOR_MERGE);

export const resumeAll = () =>
  changeLabelsOnPullRequests(
    removeLabelFromPullRequest,
    Label.MERGE_TRAIN_PAUSED
  );
