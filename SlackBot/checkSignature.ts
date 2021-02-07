import crypto from 'crypto';

export const checkSignature = (signature: string, basestring: string) => {
  const calculatedSignatureRaw = crypto
    .createHmac('sha256', process.env.SLACK_SIGNING_SECRET)
    .update(basestring)
    .digest('hex');

  return `v0=${calculatedSignatureRaw}` === signature;
};
