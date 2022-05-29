require('dotenv').config()
const uri = process.env.MONGODB_URI
const leaderboardPipe = require('./modules/leaderboard')
let leaderboardPosPipe = require('./modules/leaderboardPos')
const noFlair = require('./modules/unflaired')

const { CommentStream } = require('snoostorm')
const cron = require('node-cron')
const Snoowrap = require('snoowrap')
const MongoClient = require('mongodb').MongoClient

const client = new MongoClient(uri)
const r = new Snoowrap({
    userAgent: 'flairchange_bot v1.0.0; A bot detecting user flair changes, by u/Nerd02',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS
})
const stream = new CommentStream(r, {
    subreddit: 'PoliticalCompassMemes',
    results: 1
})

const delay = 10 //delay [minutes] between multiple messages to the same user - prevents spam
const delayMS = delay * 60000 //same value as above but in milliseconds, needed for JS Date functions
let callers = Array() //Array containing the callers who used the "!flairs" command, antispam

run()

//Main function
function run() {
    client.connect()
    const db = client.db('flairChangeBot')

    console.log('Starting up...')

    cron.schedule('0 0 * * *', () => { //Task executed every day, UTC timezone
        wallOfShame(db) //Updates Wall of shame instantly
        setTimeout(() => { //Updates leaderboard after 10 seconds, avoids RATELIMIT
            leaderboard(db)
        }, 10000)
    }, {
        timezone: 'UTC'
    })

    stream.on('item', comment => {
        if (comment == undefined) return //No clue why this happens. Probably insta-deleted comments
        if (comment.author_fullname == 't2_mdgp6gdr') return //Comment made by the bot itself, no time to lose here

        let flair = comment.author_flair_text
        if (flair != null) { //If user is NOT unflaired, parse the flair and save it
            if (comment.author_flair_richtext[0].a.slice(1, -1) === 'CENTG') //Handles alt flairs
                flair = 'GreyCentrist'
            else if (comment.author_flair_richtext[0].a.slice(1, -1) === 'libright2')
                flair = 'PurpleLibRight'
            else //Default case
                flair = flair.substring(flair.indexOf('-') + 2)
        }

        if (comment.body.includes('!flairs')) { //The bot was summoned using the "!flairs" command
            summonListFlairsWrapper(comment, db)
        }

        (async() => {
            db.collection('PCM_users').findOne({ id: comment.author_fullname }, async(err, res) => { //Check for any already present occurrence
                if (err) throw err

                if (flair === null && res === null) { //Unflaired and not in DB
                    unflaired()
                    return
                } else if (flair === null && res.flair.at(-1) != flair) { //Is in DB but switched to unflaired
                    flairChangeUnflaired(comment, res)
                } else if (res === null) { //Flaired, not in DB
                    if (comment.body.includes('!cringe')) {
                        optOut(comment, res, db, 1)
                    } else {
                        await db.collection('PCM_users').insertOne({
                            id: comment.author_fullname,
                            name: comment.author.name,
                            flair: [flair],
                            dateAdded: [new Date()]
                        })
                    }
                } else if (res.flair.at(-1) != flair) { //Already present in DB and flair change
                    flairChange(comment, db, flair, res)
                } else { //Generic comment
                    if (comment.body.includes('!cringe')) {
                        optOut(comment, res, db, 0)
                    }
                }
            })
        })()
    })
}

//Handles all flair change instances
async function flairChange(comment, db, flair, res) {
    console.log('Flair change!', comment.author.name, 'was', res.flair.at(-1), 'now is', flair)

    let dateStr = getDateStr(res.dateAdded.at(-1))
    let msg = `Did you just change your flair, u/${comment.author.name}? Last time I checked you were **${res.flair.at(-1)}** on ${dateStr}. How come now you are **${flair}**? Have you perhaps shifted your ideals? Because that's cringe, you know?\n\n*"You have the right to change your mind, as I have the right to shame you for doing so." - Anonymous*\n\n ^(I am a bot. If you want to opt-out write) **^(!cringe)** ^(in a comment. If you want to check another user's flair history write) **^(!flairs u/<name>)** ^(in a comment.)`

    let aggEntry //Resulting entry from aggregation pipeline
    leaderboardPosPipe[4] = {
        $match: { id: comment.author_fullname } //Customizes the aggregation pipeline, filtering for this single user
    }

    await db.collection('PCM_users').aggregate(leaderboardPosPipe).forEach(log => { aggEntry = log }) //Running aggregation query for current user - necessary for flair changers ranking

    if (!res.optOut && !isSpam(res)) { //If user did not opt out and isn't spamming, send message, push to DB. Doesn't push if user is spamming. SPAM: if bot has written to the same user in the last DELAY minutes
        if (aggEntry != null) { //Touch grass message, for multiple flair changers, only if user is in the top (if entire collection is returned DB crashes!)
            if (res.id === aggEntry.id && aggEntry.position <= 10) {
                let ratingN = card2ord(aggEntry.position) //Get ordinal number ('second', 'third'...)

                msg = `Did you just change your flair, u/${comment.author.name}? Last time I checked you were **${res.flair.at(-1)}** on ${dateStr}. How come now you are **${flair}**? Have you perhaps shifted your ideals? Because that's cringe, you know?\n\nOh and by the way. You have already changed your flair ${aggEntry.size} times, making you the ${ratingN} largest flair changer in this sub.\nGo touch some fucking grass.\n\n*"You have the right to change your mind, as I have the right to shame you for doing so." - Anonymous*\n\n ^(I am a bot. If you want to opt-out write) **^(!cringe)** ^(in a comment. If you want to check another user's flair history write) **^(!flairs u/<name>)** ^(in a comment.)`
                console.log('Not a grass toucher', comment.author.name)
            }
        }
        if ((res.flair.at(-1) == 'Centrist' && flair == 'GreyCentrist') || (res.flair.at(-1) == 'LibRight' && flair == 'PurpleLibRight')) { //GRACE, remove on later update. If graced still pushes to DB (ofc)
            db.collection('PCM_users').updateOne({ id: comment.author_fullname }, { $push: { flair: flair, dateAdded: new Date() } }, (err, res) => {
                if (err) throw err
            })
            console.log('Graced', comment.author.name)
        } else { //Default case, pushes to DB
            db.collection('PCM_users').updateOne({ id: comment.author_fullname }, { $push: { flair: flair, dateAdded: new Date() } }, (err, res) => {
                if (err) throw err
            })
            comment.reply(msg) //HERE'S WHERE THE MAGIC HAPPENS - let's bother some people
        }
    } else if (res.optOut) { //Opt-out, pushes to DB
        console.log('Tried answering but user', comment.author.name, 'opted out')
        db.collection('PCM_users').updateOne({ id: comment.author_fullname }, { $push: { flair: flair, dateAdded: new Date() } }, (err, res) => {
            if (err) throw err
        })
    } else if (isSpam(res)) { //Spam. Doesn't push to DB
        console.log('Tried answering but user', comment.author.name, 'is spamming')
    }
}

async function flairChangeUnflaired(comment, res) {
    console.log('Flair change!', comment.author.name, 'was', res.flair.at(-1), 'now is UNFLAIRED')

    let dateStr = getDateStr(res.dateAdded.at(-1))
    msg = `Did you just change your flair, u/${comment.author.name}? Last time I checked you were **${res.flair.at(-1)}** on ${dateStr}. How come now you are **unflaired**? Not only you are a dirty flair changer, you also willingly chose to join those subhumans. \n\nYou are beyond cringe, you are disgusting and deserving of all the downvotes you are going to get. Repent now and pick a new flair before it's too late.\n\n ^(I am a bot. If you want to opt-out write) **^(!cringe)** ^(in a comment. If you want to check another user's flair history write) **^(!flairs u/<name>)** ^(in a comment.)`

    if (!res.optOut) {
        comment.reply(msg)
    } else {
        console.log('Tried answering but user', comment.author.name, 'opted out')
    }
}

//Sends a random message reminding users to flair up. Only answers in 1/'dice' cases
function unflaired(comment) {
    let rand = Math.floor(Math.random() * noFlair.length)

    if (dice(4)) {
        console.log(`Unflaired: ${comment.author.name}`)
        comment.reply(noFlair[rand])
    }
}

//Handles optOut requests. Params: comment object, result returned from DB query, database object, context: 0: user already present, 1: user not present
async function optOut(comment, res, db, context) {
    const optOutMsg = "You are both cringe and a coward. But fine, let's have it your way. I'll stop calling you out."
    console.log('Opt-out:', comment.author.name)

    if (context == 0) { //Normal case, user is already present in the DB
        if (!res.optOut) {
            comment.reply(optOutMsg)
            await db.collection('PCM_users').updateOne({ id: comment.author_fullname }, { $set: { optOut: true } })
        }
    } else if (context == 1) { //Special case, user isn't present in DB but has requested an optOut
        comment.reply(optOutMsg)
        await db.collection('PCM_users').insertOne({ //Add them + optOut
            id: comment.author_fullname,
            name: comment.author.name,
            flair: [flair],
            dateAdded: [new Date()],
            optOut: true
        })
    }
}

//Converts a cardinal number(int) to an ordinal one (string), 1 to 10
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

//Updates the wall of shame. Post ID is hardcoded
async function wallOfShame(db) {
    let msg = 'This is the wall of shame, containing the names of all the cringe users who opted out using the \`!cringe\` command. May their cowardice never be forgotten.\n\n\n'

    console.log('Updating Wall of shame')

    cursor = db.collection('PCM_users').find({ optOut: true }, { sort: { _id: 1 }, projection: { _id: 0, dateAdded: 0, id: 0, optOut: 0 } }) //Run query, returns a cursor (see MongoDB docs)
    await cursor.forEach(item => {
        if (item.flair.length - 1 == 1)
            msg += `- ${item.name}\xa0\xa0\xa0-\xa0\xa0\xa0${item.flair.length - 1} flair change\n\n`
        else
            msg += `- ${item.name}\xa0\xa0\xa0-\xa0\xa0\xa0${item.flair.length - 1} flair changes\n\n`
    })
    msg += '\n*This post is automatically updated every day at midnight UTC.*'
    r.getSubmission('utwvvg').edit(msg) //Update post
}

//Updates the leaderboard. Post ID is hardcoded
async function leaderboard(db) {
    let msg = 'This is the leaderboard of the most frequent flair changers of r/PoliticalCompassMemes. If your name appears on this list please turn off your computer and go touch some grass. \n\n'

    console.log('Updating Leaderboard')

    cursor = db.collection('PCM_users').aggregate(leaderboardPipe) //Run query, returns a cursor (see MongoDB docs)
    i = 0 //counter needs to be implemented manually, cursor.forEach != array.forEach
    await cursor.forEach(item => {
        if (i >= 20) return //Only show the top 20 (from 0 to 19)
        i++
        msg += `${i}) ${item.name}\xa0\xa0\xa0-\xa0\xa0\xa0${item.size - 1} flair changes\n\n`
    })
    msg += '\n*This post is automatically updated every day at midnight UTC.*'
    await r.getSubmission('uuhlu2').edit(msg) //Update post
}

//Handles the "!flairs" command, checks wether a user is spamming said command or not, calls summonListFlairs if user isn't spamming
function summonListFlairsWrapper(comment, db) {
    let index

    if (callers.find(x => x.id === comment.author_fullname)) { //Is in object...
        if (callers.find(x => x.date.valueOf() + delayMS < new Date())) { //Is in object and matches criteria
            console.log('Summon: YES - In object and match criteria', comment.author.name)

            if (summonListFlairs(comment, db)) { //If param is a reddit username, update in the caller array
                console.log('Updating...')
                index = callers.findIndex(x => x.id === comment.author_fullname)
                callers[index].date = new Date()
            }

        } else { //Is in object and does NOT match criteria
            console.log('Summon: NO - In object and doesn\'t match criteria', comment.author.name)
        }
    } else { //Is not in object, OK
        console.log('Summon: YES - Not in object', comment.author.name)

        if (summonListFlairs(comment, db)) //If param is a reddit username, push to the caller array
            callers.push({ id: comment.author_fullname, date: new Date() })

    }
}

//Composes a message for the flair history of a user
async function summonListFlairs(comment, db) {
    const regexReddit = /u\/[A-Za-z0-9_-]+/gm //Regex matching a reddit username:A-Z, a-z, 0-9, _, -
    const user = comment.body.match(regexReddit) //Extract username 'u/NAME' from the message, according to the REGEX
    let msg = 'User u/' //Reply message, composed during the function

    if (user == null) { //If no username was provided exit
        console.log('Tried answering but user', comment.author.name, 'didn\'t enter a reddit username')
        return false
    }

    const username = user[0].slice(2) //Cut 'u/', get RAW username
    msg += username

    log = await db.collection('PCM_users').findOne({ name: username }) //Run query, search for provided username
    if (log == null) {
        console.log('Tried answering but user', comment.author.name, 'didn\'t enter an indexed username')
        return false
    } else if (log.flair.length > 1) { //Compose the message
        msg += ` changed their flair ${log.flair.length} times. This makes them unbelievably cringe.`
    } else {
        msg += ' never changed their flair.'
    }
    msg += ' Here\'s their flair history:\n\n'

    log.flair.forEach((elem, i) => {
        if (i == 0) {
            msg += `${i + 1}) Started as ${elem} on ${log.dateAdded[i].toUTCString()}.\n\n`
        } else {
            msg += `${i + 1}) Switched to ${elem} on ${log.dateAdded[i].toUTCString()}.\n\n`
        }
    })

    msg += `^(I am a bot, my mission is to spot cringe flair changers. You can check a user's history with the) **^( !flairs u/<name>)** ^(command. Each user can use this command once every ${delay} minutes.)` //Footer

    comment.reply(msg) //Reply!

    return true
}

//Rolls a dice. Returns true if a random int in [0 - d] is equal to d => 1/d cases
function dice(d) {
    let rand = Math.floor(Math.random() * d) + 1

    if (d == rand) return true
    else return false
}

//Formats a Date (object or text mimicking text) as ISO 8601 compliant YYYY-MM-DD
function getDateStr(param) {
    let date = new Date(param)
    let dateStr = date.getUTCFullYear().toString() + '-' + (date.getUTCMonth() + 1).toString() + '-' + date.getUTCDate().toString() //Composing date using UTC timezone

    return dateStr
}

//Checks wether a comment is spam: not spam if the last flair change was more than 'delayMS' ms ago 
function isSpam(res) {
    let now = new Date()

    if (now.valueOf() <= res.dateAdded.at(-1).valueOf() + delayMS) return true
    else return false
}