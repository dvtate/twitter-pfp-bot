import Debug from 'debug';
import TwitterApi, { ETwitterStreamEvent } from 'twitter-api-v2';
import axios from 'axios';
import { config } from 'dotenv';
config();

const debug = Debug('pfp:bot');

const bearerClient = new TwitterApi(process.env.TWIT_BEARER);
const roClient = bearerClient.readOnly;

export default async function bot(client: TwitterApi) {

    // TODO make this operation go both ways
    const userIdCache: { [k: string]: string } = {};
    const usernameCache: { [k: string]: string } = {};
    async function getUserId(username: string) {
        if (userIdCache[username])
            return userIdCache[username];

        const user = await roClient.v2.userByUsername(username);
        debug(`${user.data.name}  @${username} -> ${user.data.id}`)
        usernameCache[user.data.id] = username;
        return userIdCache[username] = user.data.id;
    }

    async function getNftPfp(username: string) {
        // TODO cache?
        const data = await roClient.v2.user(
            await getUserId(username),
            { "user.fields": ['profile_image_url']}
        );
        return data.data.profile_image_url.replace(/\_normal\./, '_400x400.');
    }

    async function startStream() {
        // Get and delete old rules if needed
        const rules = await roClient.v2.streamRules();
        if (rules.data?.length) {
            await roClient.v2.updateStreamRules({
                delete: { ids: rules.data.map(rule => rule.id) },
            });
        }

        // Add our rules
        await roClient.v2.updateStreamRules({ add: [{ value: `@${process.env.USERNAME}` }] });
        const stream = await roClient.v2.searchStream({
            'tweet.fields': ['referenced_tweets', 'author_id'],
            expansions: ['referenced_tweets.id'],
        });

        // Enable auto reconnect
        stream.autoReconnect = true;

        // Stream handler
        stream.on(ETwitterStreamEvent.Data, async tweet => {
            // Ignore RTs or self-sent tweets
            const isARt = tweet.data.referenced_tweets?.some(tweet => tweet.type === 'retweeted') ?? false;
            if (isARt || tweet.data.author_id === process.env.BOT_ID)
                return;

            debug(tweet.data.text);
            console.log(tweet);

            tweet.data.text.split(' ').map(s => s.trim())
                .filter(s => /^@.*$/.test(s) && s.slice(1) !== process.env.USERNAME)
                .forEach(async username => {
                    try {
                        const url = await getNftPfp(username.slice(1));
                        const media = await axios.get(url, { responseType: 'arraybuffer' });
                        const mediaId = await client.v1.uploadMedia(
                            Buffer.from(media.data),
                            { target: 'tweet', type: url.split('.').pop().toLowerCase() },
                        );
                        client.v2.reply(url, tweet.data.id,
                            { media: { media_ids: [mediaId] } }
                        );
                    } catch (e) {
                        debug(e);
                    }
                });
        });
    }

    startStream();
}
