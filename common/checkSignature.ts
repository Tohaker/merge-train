import { HttpRequest } from '@azure/functions';
import crypto from 'crypto';

export const checkSignature = (req: HttpRequest) => {
  const receivedSignature = req.headers['x-hub-signature'].split('=');
  const calculatedSignatureRaw = crypto
    .createHmac(receivedSignature[0], process.env.GHAPP_SECRET)
    .update(req.rawBody)
    .digest('hex');

  return calculatedSignatureRaw === receivedSignature[1];
};
