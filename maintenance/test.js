const port = process.env.PORT
const { CommentStream } = require('snoostorm');
const cron = require('node-cron');

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
(async() => {
    // cron.schedule('* * * *', () => {
    //     console.log('TESTING')
    // }, {
    //     timezone: 'UTC'
    // });
    // stream.on('item', comment => { console.log(comment.body) })

    await client.connect()
    const db = client.db('flairChangeBot');

    wallOfShame(db)
})()

async function wallOfShame(db) {
    let msg = 'This is the wall of shame, containing the names of all the cringe users who opted out using the \`!cringe\` command. May their cowardice never be forgotten.\n\n\n';

    console.log('Updating Wall of shame')

    cursor = db.collection('PCM_users').find({ optOut: true }, { sort: { _id: 1 }, projection: { _id: 0, dateAdded: 0, id: 0, optOut: 0 } }) //Run query, returns a cursor (see MongoDB docs)
    await cursor.forEach(item => {
        if (item.flair.length - 1 == 1)
            msg += `- ${item.name}\xa0\xa0\xa0-\xa0\xa0\xa0${item.flair.length-1} flair change\n\n`
        else
            msg += `- ${item.name}\xa0\xa0\xa0-\xa0\xa0\xa0${item.flair.length-1} flair changes\n\n`
    })
    msg += '\n*This post is automatically updated every day at midnight UTC.*'
    r.getSubmission('utwvvg').edit(msg) //Update post
}