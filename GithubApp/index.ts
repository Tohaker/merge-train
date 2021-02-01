import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { checkSignature } from './checkSignature';
import {
  postMessage,
  createSlackPanel,
  listConversations,
  listUsers,
} from './slackApi';
import { RequestBody, Action, User } from './types';
import {
  connectToCosmos,
  createItem,
  deleteItem,
  readAllItems,
} from '../common/cosmos';

const createAssignmentText = async (reviewers: User[]) => {
  const { members } = await listUsers();

  return reviewers
    .reduce((acc, user) => {
      const slackUser = members.find(
        (slackUser) => slackUser.profile.title === user.login
      );
      if (slackUser?.id) {
        return acc + `<@${slackUser.id}|${slackUser.profile.display_name}> `;
      } else {
        return acc + `${user.login} `;
      }
    }, '')
    .trim();
};

const httpTrigger: AzureFunction = async (
  context: Context,
  req: HttpRequest
): Promise<void> => {
  if (!checkSignature(req)) {
    context.log("Hash signature doesn't match - terminating session");
    return;
  }

  const channels: Record<string, string> = (
    await listConversations()
  ).channels.reduce(
    (acc, channel) => ((acc[channel.name] = channel.id), acc),
    {}
  );
  const { action, pull_request, label, sender }: RequestBody = req.body;

  context.log({
    action,
    pull_request,
    label,
    sender,
  });

  const labelName = label?.name.toLowerCase();
  const container = connectToCosmos();
  const items = await readAllItems(container);

  switch (action) {
    case Action.LABELED: {
      if (labelName.includes('merge')) {
        const channel = channels['merge'];

        const blocks = createSlackPanel({
          headline: 'A new PR is ready to merge',
          footer: 'This has now been added to the list :page_with_curl:',
          pull_request,
          sender,
          changed: true,
        });

        if (items.some(({ url }) => url === pull_request.html_url)) {
          context.log(`PR (${pull_request.html_url}) already saved`);
        } else {
          try {
            await createItem(container, pull_request.html_url);
            await postMessage(blocks, channel);
          } catch (e) {
            context.log('Error creating item: ', e);
          }
        }
      }
      break;
    }
    case Action.UNLABELED: {
      if (labelName.includes('merge')) {
        const channel = channels['merge'];

        const blocks = createSlackPanel({
          headline: 'A PR has had its status changed',
          footer: 'This has now been removed to the list :page_with_curl:',
          pull_request,
          sender,
          changed: true,
        });

        try {
          const id = items.find(({ url }) => url === pull_request.html_url)?.id;
          if (id) {
            await deleteItem(container, id);
            await postMessage(blocks, channel);
          } else {
            context.log('No ID found for this url');
          }
        } catch (e) {
          context.log('Error creating item: ', e);
        }
      }
      break;
    }
    case Action.REVIEW_REQUESTED: {
      const channel = channels['reviews'];
      const reviewers = await createAssignmentText(
        pull_request.requested_reviewers
      );
      const blocks = createSlackPanel({
        headline: 'A PR has been marked for review',
        footer: `The following people have been assigned: ${reviewers}`,
        pull_request,
        sender,
      });
      await postMessage(blocks, channel);
      break;
    }
    default:
      break;
  }
};

export default httpTrigger;
