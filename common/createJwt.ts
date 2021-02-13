import jwt from "jsonwebtoken";

export const createJwt = () => {
  const privateKey = process.env.PRIVATE_KEY;
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now,
    exp: now + 10 * 60 - 30,
    iss: process.env.GITHUB_APP_ID,
  };

  return jwt.sign(payload, privateKey, { algorithm: "RS256" });
};
