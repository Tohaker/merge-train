import fetch from "node-fetch";
import { AccessToken } from "./types";

export const getAccessTokens = (jwt: string) =>
  fetch(
    `${process.env.GITHUB_HOSTNAME}/api/v3/app/installations/${process.env.GITHUB_INSTALLATION_ID}/access_tokens`,
    {
      method: "POST",
      headers: {
        accept: "application/vnd.github.machine-man-preview+json",
        Authorization: `Bearer ${jwt}`,
      },
    }
  )
    .then((res) => res.json())
    .then((data: AccessToken) => data);
