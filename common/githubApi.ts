import fetch from "node-fetch";
import { AccessToken } from "./types";

export const getAccessTokens = (jwt: string) => {
  const endpoint = process.env.GITHUB_HOSTNAME
    ? `${process.env.GITHUB_HOSTNAME}/api/v3/app/installations/${process.env.GITHUB_INSTALLATION_ID}/access_tokens`
    : `https://api.github.com/app/installations/${process.env.GITHUB_INSTALLATION_ID}/access_tokens`;

  const accept = process.env.GITHUB_HOSTNAME
    ? "application/vnd.github.machine-man-preview+json"
    : "application/vnd.github.v3+json";

  return fetch(endpoint, {
    method: "POST",
    headers: {
      accept,
      Authorization: `Bearer ${jwt}`,
    },
  })
    .then((res) => res.json())
    .then((data: AccessToken) => data);
};
