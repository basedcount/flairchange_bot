const port = process.env.PORT
const { CommentStream } = require('snoostorm');

require('dotenv').config();
const Snoowrap = require('snoowrap');
const Snoostorm = require('snoostorm');

const r = new Snoowrap({
    userAgent: 'flairchange_bot v-TEST; A bot detecting user flair changes, by u/Nerd02',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS
});

const stream = new CommentStream(r, {
    subreddit: 'testingground4bots',
    results: 1
        /*,
            pollTime: 5000*/ //Add this line if reddit api seems slow
});

const optOutMsg = "You are both cringe and a coward. But fine, let's have it your way. I'll stop calling you out."

console.log('Starting up...')
stream.on('item', comment => {
    if (comment.author_fullname === 't2_105aw2') {
        if (comment.body.includes('!cringe')) {
            comment.reply(optOutMsg)
        }
    }
})