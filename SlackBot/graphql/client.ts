import { GraphQLClient } from "graphql-request";
import { createJwt } from "../../common/createJwt";
import { getAccessTokens } from "../../common/githubApi";

export const createClient = async () => {
  const jwt = createJwt();
  console.log(jwt);
  const { token } = await getAccessTokens(jwt);
  const client = new GraphQLClient(
    `${process.env.GITHUB_HOSTNAME}/api/graphql`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return client;
};
