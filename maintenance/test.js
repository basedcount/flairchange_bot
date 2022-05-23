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

const delay = 10 //delay [minutes] between multiple messages to the same user - prevents spam
const delayMS = delay * 60000 //same value as above but in milliseconds, needed for JS Date functions

let callers = Array();

(async() => {
    await client.connect()
    const db = client.db('flairChangeBot');

    stream.on('item', comment => {
            // if (comment.body.includes('!flairs')) { //Summoned the bot
            //     summonListFlairsWrapper(comment, db)
            // }
            comment.reply(`Did you just change your flair, u/${comment.author.name}? Last time I checked you were **ASD** on SOMETHING. How come now you are **DSA**? Have you perhaps shifted your ideals? Because that's cringe, you know?\n\n*"You have the right to change your mind, as I have the right to shame you for doing so." - Anonymous*\n\n^(I am a bot. If you want to opt-out write) **^(!cringe)** ^(in a comment. If you want to check another user's flair history write)**^( !flairs u/<name>)**^(in a comment)`)
            console.log(comment.body)
        })
        // wallOfShame(db) //Updates Wall of shame instantly
        // setTimeout(() => { //Updates leaderboard after 10 seconds, avoids RATELIMIT
        //     leaderboard(db)
        // }, 10000)
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

async function leaderboard(db) {
    let msg = 'This is the leaderboard of the most frequent flair changers of r/PoliticalCompassMemes. If your name appears on this list please turn off your computer and go touch some grass. \n\n'
    const aggr = [{
        $set: { size: { $size: '$flair' } }
    }, {
        $setWindowFields: {
            sortBy: { size: -1 },
            output: { position: { $rank: {} } }
        }
    }, {
        $project: {
            _id: 0,
            id: 0,
            optOut: 0,
            dateAdded: 0
        }
    }, {
        $match: { size: { $gt: 3 } } //Pruning, doesn't consider non-flair changers or unfrequent changers
    }]
    console.log('Updating Leaderboard')

    cursor = db.collection('PCM_users').aggregate(aggr) //Run query, returns a cursor (see MongoDB docs)
    i = 0 //counter needs to be implemented manually, cursor.forEach != array.forEach
    await cursor.forEach(item => {
        if (i >= 20) return //Only show the top 20 (from 0 to 19)
        i++
        msg += `${i}) ${item.name}\xa0\xa0\xa0-\xa0\xa0\xa0${item.size-1} flair changes\n\n`
    })
    msg += '\n*This post is automatically updated every day at midnight UTC.*'
    await r.getSubmission('uuhlu2').edit(msg) //Update post
}

async function summonListFlairs(comment, db) {
    const regexReddit = /u\/[A-Za-z0-9_-]+/gm //Regex matching a reddit username:A-Z, a-z, 0-9, _, -
    const user = comment.body.match(regexReddit) //Extract username 'u/NAME' from the message, according to the REGEX
    let msg = 'User ' //Reply message, composed during the function

    if (user == null) { //If no username was provided exit
        console.log('Tried answering but user', comment.author.name, 'didn\'t enter a reddit username')
        return false
    }

    const username = user[0].slice(2) //Cut 'u/', get RAW username
    msg += username

    log = await db.collection('PCM_users').findOne({ name: username }) //Run query, search for provided username
    if (log.flair.length > 1) { //Compose the message
        msg += ` changed their flair ${log.flair.length} times. This makes them unbelievably cringe.`
    } else {
        msg += ' never changed their flair.'
    }
    msg += ' Here\'s their flair history:\n\n'

    log.flair.forEach((elem, i) => {
        if (i == 0) {
            msg += `${i+1}) Started as ${elem} on ${log.dateAdded[i].toUTCString()}.\n\n`
        } else {
            msg += `${i+1}) Switched to ${elem} on ${log.dateAdded[i].toUTCString()}.\n\n`
        }
    })

    // comment.reply(msg) //Reply!
    console.log(msg)

    return true
}

function summonListFlairsWrapper(comment, db) {
    let index

    console.log(callers)

    if (callers.find(x => x.id === comment.author_fullname)) { //Is in object...
        if (callers.find(x => x.date.valueOf() + delayMS < new Date())) { //Is in object and matches criteria
            console.log('YES - In object and match criteria')

            if (summonListFlairs(comment, db)) {
                console.log('Updating...')
                index = callers.findIndex(x => x.id === comment.author_fullname)
                callers[index].date = new Date()
            }

        } else { //Is in object and does NOT match criteria
            console.log('NO - In object and doesn\'t match criteria.')
        }
    } else { //Is not in object, OK
        console.log('YES - Not in object')

        if (summonListFlairs(comment, db)) {
            console.log('Pushing...')
            callers.push({ id: comment.author_fullname, date: new Date() })
        }

    }
}