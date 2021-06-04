import { HttpRequest } from "@azure/functions";
import crypto from "crypto";

export const isMessageAuthorized = (req: HttpRequest) => {
  const auth = req.headers.authorization;
  const webhookToken = process.env.TEAMS_TOKEN;

  if (!webhookToken) {
    console.warn("Webhook token not found");
    return false;
  }

  const msgBuf = Buffer.from(req.rawBody, "utf8");
  const msgHash =
    "HMAC " +
    crypto
      .createHmac("sha256", Buffer.from(webhookToken, "base64"))
      .update(msgBuf)
      .digest("base64");

  return auth === msgHash;
};
