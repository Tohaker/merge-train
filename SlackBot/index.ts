import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import fetch from 'node-fetch';
import queryString from 'query-string';
import { parseCommand } from './command';
import { checkSignature } from './checkSignature';
import { Body, RespondProps } from './types';

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const parsed = queryString.parse(req.body) as Body;
  const respond = ({ blocks, text, response_type }: RespondProps) =>
    fetch(parsed.response_url, {
      method: 'POST',
      body: JSON.stringify({
        mrkdwn: true,
        blocks,
        text,
        response_type,
      }),
    });

  if (
    !checkSignature(
      req.headers['x-slack-signature'],
      `v0:${req.headers['x-slack-request-timestamp']}:${req.rawBody}`
    )
  ) {
    context.log('Signature does not match');
    context.done(null, { status: 401 });
    return;
  }

  if (parsed.command === '/merge') {
    const { text } = parsed;
    await parseCommand({ text, context, respond });
  }

  context.done(null, { status: 200 });
};

export default httpTrigger;
