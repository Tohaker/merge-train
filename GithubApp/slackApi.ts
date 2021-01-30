import fetch from 'node-fetch';
import { Block } from '@slack/bolt';
import { PanelData } from './types';

export const postMessage = (blocks: Block[], channel: string) =>
  fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      icon_emoji: ':steam_locomotive:',
      channel,
      blocks,
    }),
  });

export const listConversations = () =>
  fetch('https://slack.com/api/conversations.list', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

export const createSlackPanel = ({
  footer,
  headline,
  pull_request,
  sender,
  changed,
}: PanelData) => {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${headline}:\n*<${pull_request.html_url}|${pull_request.title}>*`,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `${changed ? '*Changed by:*' : '*Created by:*'}\n${
            sender.login
          }`,
        },
        {
          type: 'mrkdwn',
          text: `*When:*\n${new Date(pull_request.updated_at).toLocaleString(
            'en-GB'
          )}`,
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: footer,
      },
    },
  ];
};
