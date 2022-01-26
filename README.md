# Twitter Profile Picture Bot
This bot was more or less made only to annoy users of Twitter's new NFT Verified Profile picture feature. I wrote most of the code in a few hours late at night while under the influence of alcohol.

## Installation and running
```
# Install dependencies
$ npm install

# Set up private variables
$ vim .env

# Compile typescript
$ npm run build

# Start bot
$ npm start
```
Running the bot this way will prompt you to open an oauth verification link and upon verifying it with the account you want the bot to operate on it should work as deisred.

## What does it do?
When mentioned, along with another user, the bot will reply with the mentioned user's profile picture

## Known bugs
It doesn't understand the difference between replies and mentions so if the bot is mentioned in a long thread in which many people are tagged it will reply with literally all of their profile pictures which probably isn't desired. So don't reply to the bot lol.

## Future plans?
no :(
