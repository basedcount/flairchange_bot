const port = process.env.PORT
const { CommentStream } = require('snoostorm');

require('dotenv').config();
const Snoowrap = require('snoowrap');
const Snoostorm = require('snoostorm');

const MongoClient = require('mongodb').MongoClient;
const uri = process.env.MONGODB_URI
const client = new MongoClient(uri);

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

client.connect()
const db = client.db('flairChangeBot');

const optOutMsg = "You are both cringe and a coward. But fine, let's have it your way. I'll stop calling you out."

console.log('Starting up...')
stream.on('item', comment => {
    if (comment.author_fullname === 't2_105aw2') {
        (async() => {
            now = new Date()
            fiveMin = 300000
            db.collection('PCM_users').findOne({ id: comment.author_fullname }, async(err, res) => { //Check for any already present occurrence
                if (err) throw err

                if (now.valueOf() > res.dateAdded.at(-1).valueOf() + fiveMin) {
                    console.log('5 minutes have passed')
                } else {
                    console.log('5 minutes haven\'t passed yet')
                }

            })
        })()
    }
})