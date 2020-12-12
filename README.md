# Merge Train Slack Bot

This project consists of a Node JS Azure serverless function that can be invoked through a Slack Bot to keep track of a growing list of Merge requests.

## Using the bot

The proposed contract for interacting with the bot on Slack is as follows:

* `/merge add <github URL>` - Add a URL to the merge train.
* `/merge next` - Display the next URL in the list. This will not remove it from the list.
* `/merge list` - Display all URLs in the list, in the order they were added.
* `/merge pop` - Remove the last URL from the list and display it.
* `/merge clear` - Clear the entire list. The list will be displayed before it clears in case this action is performed accidentally.

## Local testing

[Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local) are needed to run this project locally. 
Additionally, [Terraform](terraform.io) is required to deploy the function, along with the [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) and an Azure account.

If you build and run the project in the VSCode DevContainer all prerequisites will be installed automatically - this is the recommended method of development.

To run the function locally;
```bash
npm i
npm start
```

This will install all dependencies and begin running the function on a random port. You can then send POST requests to interact with the bot.