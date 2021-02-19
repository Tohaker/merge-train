export const getPullRequestsReadyForMerge = `
  query getPullRequestsReadyForMerge($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      pullRequests(states: OPEN, labels: ["Ready for merge"], last: 30) {
        nodes {
          title
          url
          mergeable
          timelineItems(itemTypes: [LABELED_EVENT], last: 1) {
            updatedAt
          }
        }
      }
    }
  }
`;
