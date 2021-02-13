export const helpText =
  "How to use the Merge Train Slack Bot:\n \
* `/merge next` - Display the next URL in the list. This will not remove it from the list.\n \
* `/merge list (public)` - Display all URLs in the list, in the order they were added. Add `public` to share this list with the channel.\n \
* `/merge help` - Display this message again.";

export const invalidCommand =
  "Sorry, this command is invalid. Valid commands are `next` | `list` | `help`";

export const nextSuccess = (url: string) => `Next PR ➡ ${url}`;

export const listSuccess = (list: string) => `Current list 📃\n${list}`;

export const listEmpty = "The list is empty - that deserves a treat 🍩";
