import { createAppAuth } from "@octokit/auth-app";
import { graphql } from "@octokit/graphql";
import { request } from "@octokit/request";

export const createClient = async () => {
  const baseUrl = `${process.env.GITHUB_HOSTNAME}/api/v3`;

  const appAuthOptions = {
    appId: process.env.GITHUB_APP_ID,
    privateKey: process.env.PRIVATE_KEY,
    installationId: process.env.GITHUB_INSTALLATION_ID,
  };

  if (process.env.GITHUB_HOSTNAME) {
    appAuthOptions["request"] = request.defaults({
      baseUrl,
    });
  }

  const auth = createAppAuth(appAuthOptions);
  console.log(
    (
      await auth({
        type: "installation",
        permissions: { pull_requests: "write" },
      })
    ).token
  );

  const graphqlWithAuth = graphql.defaults({
    baseUrl,
    request: {
      hook: auth.hook,
    },
  });

  return graphqlWithAuth;
};
