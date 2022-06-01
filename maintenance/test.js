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
const strings = require('../modules/strings')
const leaderboardPos = require('../modules/leaderboardPos')

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

stream.on('item', comment => {
    (async() => {
        await client.connect()
        const db = client.db('flairChangeBot');

        // console.log(strings.getFlair('Nerd02', 'AuthRight', '2022-12-04', 'Centrist'))

        // let target = 'Centrist'
        // db.collection('PCM_users').aggregate([{
        //     $project: {
        //         _id: 0,
        //         flair: 1,
        //         name: 1
        //     }
        // }, { $unwind: "$flair" }, {
        //     $group: {
        //         _id: "$flair"
        //     }
        // }]).forEach(el => {
        //     if (isNear(el._id, target))
        //         console.log(el._id, 'is near', target)
        //     else
        //         console.log(el._id, 'is NOT near', target)
        // })

        console.log(strings.getFlair('Nerd02', 'AuthLeft', '2022-12-23', 'AuthCentercd'))
    })()
})

function isNear(oldF, newF) {
    if (ngbr[oldF].includes(newF))
        return true
    else
        return false
}