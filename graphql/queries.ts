export const getPullRequestsReadyForMerge = `
  query getPullRequestsReadyForMerge($owner: String!, $repo: String!, $label: String!) {
    repository(owner: $owner, name: $repo) {
      defaultBranchRef {
        target {
          commitUrl
        }
      }
      pullRequests(states: OPEN, labels: [$label], last: 30) {
        nodes {
          title
          url
          mergeable
          timelineItems(itemTypes: [LABELED_EVENT], last: 1) {
            updatedAt
          }
          labels(last: 5) {
            nodes{
              name
              id
            }
          }
          commits(last: 1) {
            nodes {
              commit {
                status {
                  state
                  contexts {
                    description
                    state
                    targetUrl
                    creator {
                      login
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const getCommitStatus = `
  query GetCommitStatus($commitRef: URI!) {
    resource(url: $commitRef) {
      ... on Commit {
        status {
          state
        }
      }
    }
  }
`;

export const getLabelsAndPullRequests = `
  query GetLabels($owner: String!, $repo: String!, $labelToApply: String!, $labelsOnPullRequests: String!) {
    repository(owner: $owner, name: $repo) {
      labels(query: $labelToApply, first: 1) {
        nodes {
          name
          id
        }
      }
      pullRequests(labels: [$labelsOnPullRequests], states: [OPEN], last: 30) {
        nodes {
          title
          id
        }
      }
    }
  }
`;

export const addLabelToPullRequest = `
  mutation AddLabel($labelId: String!, $pullRequestId: String!) {
    addLabelsToLabelable(input: {labelIds: [$labelId], labelableId: $pullRequestId}) {
      clientMutationId
      labelable {
        ... on PullRequest {
          id
          title
        }
      }
    }
  }
`;

export const removeLabelFromPullRequest = `
  mutation RemoveLabel($labelId: String!, $pullRequestId: String!) {
    removeLabelsFromLabelable(input: {labelIds: [$labelId], labelableId: $pullRequestId}) {
      clientMutationId
      labelable {
        ... on PullRequest {
          id
          title
        }
      }
    }
  }
`;
