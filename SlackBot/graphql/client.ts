import { GraphQLClient } from "graphql-request";
import { createJwt } from "../../common/createJwt";
import { getAccessTokens } from "../../common/githubApi";

export const createClient = async () => {
  const jwt = createJwt();
  console.log(jwt);
  const { token } = await getAccessTokens(jwt);
  const endpoint = process.env.GITHUB_HOSTNAME
    ? `${process.env.GITHUB_HOSTNAME}/api/graphql`
    : "https://api.github.com/graphql";

  const client = new GraphQLClient(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return client;
};
