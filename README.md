# flairchange_bot
A bot detecting flair changes in r/PoliticalCompassMemes.

Both current and historical data are collected in a database. Whenever a flair change is noticed in a comment, the bot will answer said comment calling out the poster for changing their flair. This is not guaranteed, as certain [circumstances](#flair-changes) must be met.

## Flair changes
The bot will answer to every notable shift on the [political compass](https://i.redd.it/hklcdjt60y531.png) it comes across. Any shift towards quadrants non-adjacent to the starting one or shifts towards the centrist quadrant are considerated notable.  
For smaller shifts the bot will only post 15% of times (the data will be collected regardless).  

Depending on the new flair chosen by the user, they'll receive a slightly different message. If they are among the top 10 flair changers they'll receive a custom message, letting everyone now their position on the [leaderboard](#leaderboard).  

There is a 5 minutes anti spam delay for flair changes: if multiple changes occur during this time window only the first one will be answered (and saved in the database). Any further flair change will be discarded until 5 minutes have passed since the latest change saved in the database.

## Flair history
It's possible to summon the bot and inquire regarding an user's flair history. This is done by using the `!flairs` command. This command is available only on r/PoliticalCompassMemes.  
**Example:** `!flairs u/flairchange_bot`.  
There is a 2 minutes anti spam limit per user for the usage of this command. Errors such as: badly written Reddit usernames or usernames not present in the database will not trigger the anti spam timer.

## Leaderboard
The usernames of the top 20 flair changers of the subreddit are saved on the [leaderboard](https://www.reddit.com/user/flairchange_bot/comments/uuhlu2/leaderboard/). This reddit post is automatically updated every six hours starting each day at midnight UTC.

## Unflaired
Whenever the bot comes across comments from unflaired users (users who didn't set any flair or chose to hide it from the community) there's a 15% chance it'll answer with a custom message. These messages are picked at random from a pool of insults or otherwise rude messages. See the [Disclaimer](#disclaimer) further down this page.

## Opt out
The bot used to have an on-demand opt out feature at time of launch. User experience proved this feature to be not necessary, therefore [it has been removed](https://www.reddit.com/user/flairchange_bot/comments/v8f90t/about_the_opt_out_feature/).

## API
Some of the data gathered by the bot is available through the bot's official [API](https://github.com/ornato-t/flairchange_bot-api).

## Contributions
Contributions by willing developers are always welcome. Write a Reddit message to u/[Nerd02](https://www.reddit.com/user/Nerd02) if you'd like to help [flairchange_bot](#) grow.

## Disclaimer
Some of the comments submitted by this bot feature strong and explicit language. Users may find unsettling the usage of such wording or the referencing of certain extreme political ideologies. For all intents and purposes this bot uses such quotes in a satirical manner. No insult is meant to hurt the users. Neither the bot nor its creator condone or support any of the ideologies quoted by the bot.  
Users disturbed by the bot's behaviour are advised to block it on Reddit, this will hide the bot's comments from their feeds.
