import Debug from 'debug';
import * as express from 'express';
import TwitterApi from 'twitter-api-v2';
import bot from './bot';
import { config } from 'dotenv';
config();

const debug = Debug('pfp:auth');

let oauth_token: string;
let oauth_token_secret: string;

const app = express();
app.get('/callback', async (req, res) => {
    // Exact tokens from query string
    const { oauth_verifier } = req.query;
    if (req.query.oauth_token !== oauth_token) {
        console.log('wtf??', req.query.oauth_token);
    }

    // console.log({oauth_token, oauth_token_secret, oauth_verifier});

    if (!oauth_token || !oauth_verifier || !oauth_token_secret) {
        return res.status(400).send('You denied the app or your session expired!');
    }

    // Obtain the persistent tokens
    // Create a client from temporary tokens
    const client = new TwitterApi({
        appKey: process.env.TWIT_API_KEY,
        appSecret: process.env.TWIT_API_SECRET,
        accessToken: oauth_token as string,
        accessSecret: oauth_token_secret,
    });

    client.login(oauth_verifier as string)
    .then(({ client: loggedClient, accessToken, accessSecret }) => {
        // console.log({accessToken, accessSecret});
        res.send('success :D');
        debug('logged in successfully');
        bot(loggedClient);
    })
    .catch(() => res.status(403).send('Invalid verifier or access tokens!'));
});
app.listen(8081, () => debug('callback server listening on port 8080'));

async function getClient() {
    // Make client
    const client = new TwitterApi({
        appKey: process.env.TWIT_API_KEY,
        appSecret: process.env.TWIT_API_SECRET,
    });

    const link = await client.generateAuthLink('http://xtie.net:8081/callback', /*{ linkMode: 'authorize' } */);
    oauth_token = link.oauth_token;
    oauth_token_secret = link.oauth_token_secret;
    debug('please grant access: ', link.url);
}

getClient();
