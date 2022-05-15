const port = process.env.PORT
const { CommentStream } = require('snoostorm');

require('dotenv').config();
const Snoowrap = require('snoowrap');
const Snoostorm = require('snoostorm');

const MongoClient = require('mongodb').MongoClient;
const uri = process.env.MONGODB_URI
const client = new MongoClient(uri);

const r = new Snoowrap({
    userAgent: 'flairchange_bot v0 - TEST; A bot detecting user flair changes, by u/Nerd02',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS
});

const stream = new CommentStream(r, {
    // subreddit: 'testingground4bots',
    subreddit: 'PoliticalCompassMemes',
    results: 1,
    pollTime: 5000 //Add this line if reddit api seems slow
});

client.connect()
const db = client.db('flairChangeBot');

const aggr = [{
    '$project': {
        '_id': 0,
        'id': 1,
        'changes': {
            '$size': '$flair'
        }
    }
}, {
    '$sort': {
        'changes': -1
    }
}, {
    '$limit': 10
}]

stream.on('item', comment => {

    // if (comment.author_fullname === 't2_105aw2') { //Test line, remove on release (only answers DEV - prevents spam)
    //     console.log(comment.body)
    //     if (comment.body === '!cringe') {
    //         console.log('User is cringe')
    //         comment.reply('You are cringe')
    //     } else
    //         comment.reply('No cringe detected')
    // }

    (async() => {
        const aggCursor = db.collection('PCM_users').aggregate(aggr)
        await aggCursor.forEach((entry, i) => {
            if (entry.id === comment.author_fullname) {
                console.log(comment.author.name, comment.body, '| ranking:', i + 1, '@', entry.changes)
            }
        })
    })
    // console.log(msg)
})