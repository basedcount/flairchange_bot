const port = process.env.PORT
const { CommentStream } = require('snoostorm');
const cron = require('node-cron');

require('dotenv').config();
const Snoowrap = require('snoowrap');
const Snoostorm = require('snoostorm');

const MongoClient = require('mongodb').MongoClient;
const uri = process.env.MONGODB_URI
const client = new MongoClient(uri);

const ngbr = require('../modules/neighbour')
    // const { getFlair, getGrass, getUnflaired, getOptOut, getListFlairs, getSmallShift } = require('../modules/strings')
const leaderboardPos = require('../modules/leaderboardPos')

const r = new Snoowrap({
    userAgent: 'flairchange_bot v-TEST; A bot detecting user flair changes, by u/Nerd02',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS
});

// const stream = new CommentStream(r, {
//     subreddit: 'testingground4bots',
//     results: 1
// });

// stream.on('item', comment => {
(async() => {

    await client.connect()
    const db = client.db('flairChangeBot')

    let log = await db.collection('PCM_users').findOne({ name: 'Nerd02' })
    console.log(log)

    if (log.dateAdded[0] < new Date('2022-04-25')) {
        console.log('Old')
    } else {
        console.log('New')
    }
})()