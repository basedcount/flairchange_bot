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
    userAgent: 'flairchange_bot v1.0.0; A bot detecting user flair changes, by u/Nerd02',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS
});

const stream = new CommentStream(r, {
    subreddit: 'PoliticalCompassMemes',
    results: 1
        /*,
            pollTime: 5000*/ //Add this line if reddit api seems slow
});

const delay = 1 //delay [minutes] between multiple messages to the same user - prevents spam
let delayMS = delay * 60000 //same value as above but in milliseconds, needed for JS Date functions
const optOutMsg = "You are both cringe and a coward. But fine, let's have it your way. I'll stop calling you out."

client.connect()
const db = client.db('flairChangeBot');

console.log('Starting up...');
cron.schedule('0 0 * * *', () => { //Task executed every day, UTC timezone
    wallOfShame(db) //Updates Wall of shame instantly
    setTimeout(() => { //Updates leaderboard after 10 seconds, avoids RATELIMIT
        leaderboard(db)
    }, 10000)
}, {
    timezone: 'UTC'
});
stream.on('item', comment => {
    let flair = comment.author_flair_text
    const aggr = [{ //MongoDB aggregation pipeline, gets leaderboard position (if any)
        $set: { size: { $size: '$flair' } }
    }, {
        $setWindowFields: {
            sortBy: { size: -1 },
            output: { position: { $rank: {} } }
        }
    }, {
        $project: {
            _id: 0,
            optOut: 0
        }
    }, {
        $match: { id: comment.author_fullname }
    }]

    if (flair != null) { //If user is NOT unflaired, parse the flair and save it correctly
        flair = flair.substring(flair.indexOf('-') + 2)
    } else { //User is unflaired, no need to lose my time here
        return
    }

    (async() => {
        let aggEntry
        await db.collection('PCM_users').aggregate(aggr).forEach(log => { aggEntry = log }) //Running aggregation query for current user - necessary for flair changers ranking

        db.collection('PCM_users').findOne({ id: comment.author_fullname }, async(err, res) => { //Check for any already present occurrence
            if (err) throw err

            if (res === null) { //User not present in DB
                if (comment.body.includes('!cringe') && comment.author_fullname != 't2_mdgp6gdr') { //If user asked for an opt out (as a first message ever on the sub, unlikely)
                    console.log('Opt-out:', comment.author.name)
                    comment.reply(optOutMsg) //opt out reply message
                    await db.collection('PCM_users').insertOne({ //Add them + optOut
                        id: comment.author_fullname,
                        name: comment.author.name,
                        flair: [flair],
                        dateAdded: [new Date()],
                        optOut: true
                    })
                } else {
                    await db.collection('PCM_users').insertOne({ //Add them
                        id: comment.author_fullname,
                        name: comment.author.name,
                        flair: [flair],
                        dateAdded: [new Date()]
                    })
                }

            } else if (res.flair.at(-1) != flair) { //User already present in DB and has update their flair!
                console.log('Flair change!', comment.author.name, 'was', res.flair.at(-1), 'now is', flair)
                let now = new Date()
                let date = new Date(res.dateAdded.at(-1))
                let dateStr = date.getUTCFullYear().toString() + '-' + (date.getUTCMonth() + 1).toString() + '-' + date.getUTCDate().toString() //Composing date using UTC timezone
                let msg = `Did you just change your flair, u/${comment.author.name}? Last time I checked you were **${res.flair.at(-1)}** on ${dateStr}. How come now you are **${flair}**? Have you perhaps shifted your ideals? Because that's cringe, you know?\n\n*"You have the right to change your mind, as I have the right to shame you for doing so." - Anonymus*\n\n^(Bip bop, I am a bot; don't get too mad. If you want to opt-out write) **^(!cringe)** ^(in a comment)`

                if (!res.optOut && now.valueOf() > res.dateAdded.at(-1).valueOf() + delayMS) { //If user did not opt out and isn't spamming, send message - push to DB either way tho. SPAM: if bot has written to the same user in the last DELAY minutes
                    if (res.id === aggEntry.id && aggEntry.position <= 10) { //Touch grass message, for multiple flair changers
                        let ratingN = card2ord(aggEntry.position) //Get ordinal number - not for largest

                        msg = `Did you just change your flair, u/${comment.author.name}? Last time I checked you were **${res.flair.at(-1)}** on ${dateStr}. How come now you are **${flair}**?  \nHave you perhaps shifted your ideals? Because that's cringe, you know?\n\nOh and by the way. You have already changed your flair ${aggEntry.size} times, making you the ${ratingN} largest flair changer in this sub.\nGo touch some fucking grass.\n\n*"You have the right to change your mind, as I have the right to shame you for doing so." - Anonymus*\n\n^(Bip bop, I am a bot; don't get too mad. If you want to opt-out write) **^(!cringe)** ^(in a comment)`
                        console.log('Not a grass toucher', comment.author.name)
                    }

                    comment.reply(msg) //HERE'S WHERE THE MAGIC HAPPENS - let's bother some people
                } else if (res.optOut) {
                    console.log('Tried answering but user', comment.author.name, 'opted out')

                } else if (now.valueOf() <= res.dateAdded.at(-1).valueOf() + delayMS) {
                    console.log('Tried answering but user', comment.author.name, 'is spamming')

                }
                db.collection('PCM_users').updateOne({ id: comment.author_fullname }, { $push: { flair: flair, dateAdded: new Date() } }, (err, res) => {
                    if (err) throw err
                })

                if (comment.body.includes('!cringe') && comment.author_fullname != 't2_mdgp6gdr') { //If user asked for an opt out (whilst getting called out for changing flair, unlikely)
                    if (!res.optOut) { //Only reply if user hasn't already opted out
                        console.log('Opt-out:', comment.author.name)
                        comment.reply(optOutMsg) //opt out reply message
                        await db.collection('PCM_users').updateOne({ id: comment.author_fullname }, { $set: { optOut: true } })
                    }

                }
            } else { //Default case
                if (comment.body.includes('!cringe') && comment.author_fullname != 't2_mdgp6gdr') { //If user has opted out in generic comment, likely
                    if (!res.optOut) { //Only reply if user hasn't already opted out
                        console.log('Opt-out:', comment.author.name)
                        comment.reply(optOutMsg) //opt out reply message
                        await db.collection('PCM_users').updateOne({ id: comment.author_fullname }, { $set: { optOut: true } })
                    }
                }
            }
        })
    })()
})

function card2ord(param) {
    switch (param) {
        case 1:
            return ''
        case 2:
            return 'second'
        case 3:
            return 'third'
        case 4:
            return 'fourth'
        case 5:
            return 'fifth'
        case 6:
            return 'sixth'
        case 7:
            return 'seventh'
        case 8:
            return 'eighth'
        case 9:
            return 'ninth'
        case 10:
            return 'tenth'
        default:
            return `number ${param}`
    }
}

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