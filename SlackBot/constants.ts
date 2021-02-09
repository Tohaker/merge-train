export const helpText =
  "How to use the Merge Train Slack Bot:\n \
* `/merge add <github URL>` - Add a URL to the merge train.\n \
* `/merge next` - Display the next URL in the list. This will not remove it from the list.\n \
* `/merge list (public)` - Display all URLs in the list, in the order they were added. Add `public` to share this list with the channel.\n \
* `/merge unshift` - Remove the last URL from the list and display it.\n \
* `/merge pop` - Remove the most recent URL from the list and display it.\n \
* `/merge clear` - Clear the entire list. The list will be displayed before it clears in case this action is performed accidentally.\n \
* `/merge help` - Display this message again.";

export const invalidCommand =
  "Sorry, this command is invalid. Valid commands are `add` | `next` | `list`| `unshift` | `clear`";

export const addSuccess = (url: string) => `Added ${url} to list 📃`;

export const addError =
  "Sorry, this couldn't be added to the list. Tell Miles and maybe he can work out why.";

export const nextSuccess = (url: string) => `Next PR ➡ ${url}`;

export const listSuccess = (list: string) => `Current list 📃\n ${list}`;

export const listEmpty = "The list is empty - that deserves a treat 🍩";

export const unshiftSuccess = (url: string) =>
  `Next PR ➡ ${url} \nThis has now been removed from the list 📃`;

export const unshiftError = (url: string) =>
  `Sorry, this couldn't be removed from the list. Tell Miles and maybe he can work out why.\n Here's what I found anyway: ${url}`;

export const popSuccess = (url: string) =>
  `Most recently added PR ➡ ${url} \nThis has now been removed from the list 📃`;

export const popError = (url: string) =>
  `Sorry, this couldn't be removed from the list. Tell Miles and maybe he can work out why.\n Here's what I found anyway: ${url}`;

export const clearSuccess = (list: string) =>
  `List has been purged 📃 \nHere's what was in it:\n${list}`;

export const clearError =
  "Sorry, the list couldn't be cleared. Tell Miles and maybe he can work out why.";
