# Merge Train

This project consists of Node JS Azure serverless functions that make up the Merge Train bot. These are as follows;

- A function that can be invoked through a Slack Bot to keep track of a growing list of Merge requests.
- A function that is invoked by Github Webhooks whenever a PR is modified.

## Using the Slack Bot

The proposed contract for interacting with the bot on Slack is as follows:

- `/merge add <github URL>` - Add a URL to the merge train.
- `/merge next` - Display the next URL in the list. This will not remove it from the list.
- `/merge list (public)` - Display all URLs in the list, in the order they were added. Add `public` to share this list with the channel.
- `/merge unshift` - Remove the last URL from the list and display it.
- `/merge clear` - Clear the entire list. The list will be displayed before it clears in case this action is performed accidentally.
- `/merge help` - Display this contract to the user as an ephemeral message.

## Using the Github App

The Github App function will be invoked whenever whatever webhook you set is triggered. For the purposes of this bot, only Pull Request webhooks (specifically adding and removing labels, and adding reviewers) will cause any real computation to take place.

| Action           | Output                                                                                                                                                                                                                                                                                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Labeled          | If the label mentions "merge", this PR will be added to same merge list controlled by the Slack Bot. A receipt will be posted to the "merge" Slack channel.                                                                                                                                                                                                     |
| Unlabeled        | If the label mentions "merge", this PR will be removed from the merge list, if it was already in the list. A receipt will be posted to the "merge" Slack channel.                                                                                                                                                                                               |
| Review Requested | A message will be posted to the "reviews" Slack channel, tagging the users requested. To avoid duplicate calls, this app is setup to only look for a `requested_team` property, as this indicates users have been selected from an organisation team by GitHub. If your organisation does not use this, you will need to modify this code to ignore this field. |

## Configuration

Some basic configuration options are available for the GitHub App. The [config](GithubApp/config.ts) file contains a list of channels that correspond the kinds of channels that your Slack Workspace will need. If your channel names vary, you can change them before deployment.

If you want Slack users to be tagged in the reviews, they will need to add their GitHub login ID to their Slack profile under "What I do". If this is not filled, the GitHub ID will be posted instead.

## Deployment

Deployment is handled through [Terraform](terraform.io), using an Azure Service Principal to autheticate with an Azure account. See the following table for the Environment Variables the deployment expects;

| Variable Name        | Purpose                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ARM_ACCESS_KEY       | The storage access key for saving Terraform state files. If you don't need this, remove the `backend` block from [the provider file](deployment/provider.tf) |
| ARM_CLIENT_ID        | Azure service principal app ID                                                                                                                               |
| ARM_CLIENT_SECRET    | Azure service principal password                                                                                                                             |
| ARM_SUBSCRIPTION_ID  | Azure subscription to deploy to                                                                                                                              |
| ARM_TENANT_ID        | Azure service principal tenant                                                                                                                               |
| SLACK_BOT_TOKEN      | Slack OAuth token required for posting and listening to messages                                                                                             |
| SLACK_SIGNING_SECRET | Secret used to authenticate messages coming from Slack                                                                                                       |
| GHAPP_SECRET         | GitHub App secret required to authenticate messages coming from GitHub                                                                                       |

Before running the terraform deployment, you have to package the apps. This can be done by running

```bash
npm i
npm run build

npm ci --only=prod  # Dev dependencies aren't needed and will bloat the function zip files
npm i -g @ffflorian/jszip-cli mkdirp
npm run build:zip
```

To run the deployment manually, you'll need the [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) and be logged into an account with an active subscription. Then run the following;

```bash
cd deployment
terraform init
terraform apply
```

This repostory also includes a [GitHub Actions workflow](.github/workflows/deploy.yml) as an example of how to deploy the apps in a CI environment.

## Local testing

[Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local) are needed to run this project locally.

If you build and run the project in the VSCode DevContainer all prerequisites will be installed automatically - this is the recommended method of development.

To run the function locally;

```bash
npm i
npm start
```

This will install all dependencies and begin running the function on a random port. You can then send POST requests to interact with the bot.

Unit tests are also available to run with

```bash
npm t
```
