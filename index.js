require('dotenv').config()
const uri = process.env.MONGODB_URI

const leaderboardPipe = require('./modules/leaderboard')
const leaderboardPos = require('./modules/leaderboardPos')
const noFlair = require('./modules/unflaired')
const ngbr = require('./modules/neighbour')
const { getFlair, getGrass, getUnflaired, getOptOut, getListFlairs, getListFlairsErr } = require('./modules/strings')
const c = require('./modules/const')

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

let callers = Array() //Array containing the callers who used the "!flairs" command, antispam

run()

//Main function
function run() {
    client.connect()
    const db = client.db('flairChangeBot').collection('PCM_users')

    console.log('Starting up...')

    if (!c.DEBUG) {
        cron.schedule('0 */6 * * *', () => { //Task executed every six hours, UTC timezone, only if debug mode is off
            leaderboard(db) //Updates Leaderboard instantly
            setTimeout(() => { //Updates Wall of shame after 10 seconds, avoids RATELIMIT
                wallOfShame(db)
            }, 10000)
        }, { timezone: 'UTC' })
    }

    stream.on('item', comment => {
        if (comment.author_fullname == 't2_mdgp6gdr') return //Comment made by the bot itself, no time to lose here

        let flair = flairText(comment);

        (async() => {
            db.findOne({ id: comment.author_fullname }, async(err, res) => { //Check for any already present occurrence
                if (err) throw err

                if (flair === null && res === null) { //Unflaired and not in DB
                    unflaired(comment)

                } else if (res === null) { //Flaired, not in DB
                    if (comment.body.includes('!cringe')) {
                        optOut(comment, res, db, 1) //Context 1 handles the new user inserction

                    } else {
                        newUser(comment, db, flair)

                    }

                } else if (flair === null && res.flair.at(-1) == 'null') { //Unflaired, is in DB and is a registered unflaired
                    unflaired(comment)

                } else if (flair === null && res.flair.at(-1) != flair) { //Is in DB but switched to unflaired
                    flairChangeUnflaired(comment, res, db)

                } else if (res.flair.at(-1) != flair) { //Already present in DB and flair change
                    flairChange(comment, db, flair, res)

                } else { //Generic comment
                    if (comment.body.includes('!cringe')) {
                        optOut(comment, res, db, 0)
                    }
                }
            })
        })()

        if (comment.body.includes('!flairs')) { //The bot was summoned using the "!flairs" command
            setTimeout(() => {
                    summonListFlairsWrapper(comment, db)
                }, 10000) //Wait 10 seconds (in case of both flair change and summon, avoid ratelimit)
        }
    })
}


//SECONDARY FUNCTIONS - called by the main function


//Handles all flair change instances
async function flairChange(comment, db, flair, res) {
    console.log('Flair change!', comment.author.name, 'was', res.flair.at(-1), 'now is', flair)

    let dateStr = getDateStr(res.dateAdded.at(-1))
    let msg = getFlair(comment.author.name, res.flair.at(-1), dateStr, flair)
    let aggEntry //Resulting entry from aggregation pipeline
    let leaderboardPosPipe = leaderboardPos(comment.author_fullname) //MongoDB aggregation pipeline, gets top flair changers

    await db.aggregate(leaderboardPosPipe).forEach(log => { aggEntry = log }) //Running aggregation query for current user - necessary for flair changers ranking

    if (!isSpam(res)) { //If user isn't spamming, send message, push to DB
        if (res.flair.at(-1) == 'null') { //If user went unflaired and has now flaired up: push to db without sending any message
            db.updateOne({ id: comment.author_fullname }, { $push: { flair: flair, dateAdded: new Date() } }, err => { if (err) throw err })
            return
        }

        if (aggEntry != null) { //Touch grass message, for multiple flair changers, only if user is in the top (if entire collection is returned DB crashes!)
            if (aggEntry.position <= 10) {
                let ratingN = card2ord(aggEntry.position) //Get ordinal number ('second', 'third'...)

                msg = getGrass(comment.author.name, res.flair.at(-1), dateStr, flair, aggEntry.size, ratingN)
                console.log('\tNot a grass toucher', comment.author.name)
            }
        } else { //Regular message
            near = isNear(res.flair.at(-1), flair)
            if (near && !dice(c.NEIGHBOUR_DICE)) { //If flairs are neighbouring. Only answers a percentage of times (1/4), ends every other time
                console.log('\tNeighbour, posting')
                db.updateOne({ id: comment.author_fullname }, { $push: { flair: flair, dateAdded: new Date() } }, err => { if (err) throw err }) //ERROR, ONLY TEMPORARY FIX DEV TODO: logging is wrong, the two are inverted + on small shifts data doesn't get saved. SEVERE
                return
            } else if (near) {
                console.log('\tNeighbour, not posting')
            } else {
                console.log('\tNot neighbour')
            }
        }

        if ((res.flair.at(-1) == 'Centrist' && flair == 'GreyCentrist') || (res.flair.at(-1) == 'LibRight' && flair == 'PurpleLibRight')) { //GRACE, remove on later update. If graced still pushes to DB (ofc)
            db.updateOne({ id: comment.author_fullname }, { $push: { flair: flair, dateAdded: new Date() } }, err => { if (err) throw err })

            console.log('Graced', comment.author.name)
        } else { //Default case, pushes to DB
            db.updateOne({ id: comment.author_fullname }, { $push: { flair: flair, dateAdded: new Date() } }, err => { if (err) throw err })

            reply(comment, msg) //HERE'S WHERE THE MAGIC HAPPENS - let's bother some people
        }
    } else { //Spam. Doesn't push to DB
        console.log('Tried answering but user', comment.author.name, 'is spamming')
    }
}

//Detects changes from any flair to unflaired. Toggles the 'unflaired' attribute in the DB
async function flairChangeUnflaired(comment, res, db) {
    console.log('Flair change!', comment.author.name, 'was', res.flair.at(-1), 'now is UNFLAIRED')
    if (!isSpam(res)) {
        let dateStr = getDateStr(res.dateAdded.at(-1))
        msg = getUnflaired(comment.author.name, res.flair.at(-1), dateStr)

        reply(comment, msg)

        await db.updateOne({ id: res.id }, { $push: { flair: 'null', dateAdded: new Date() } })

    } else { //Spam. Doesn't push to DB
        console.log('Tried answering but user', comment.author.name, 'is spamming')
    }
}

//Sends a random message reminding users to flair up. Only answers in 1/'dice' cases
function unflaired(comment) {
    if (comment == undefined) return //No clue why this happens. Probably insta-deleted comments

    let rand = Math.floor(Math.random() * noFlair.length)

    if (dice(c.UNFLAIRED_DICE)) {
        console.log(`Unflaired: ${comment.author.name}`)
        reply(comment, noFlair[rand])
    }
}

//Handles optOut requests. Params: comment object, result returned from DB query, database object, context: 0: user already present, 1: user not present
async function optOut(comment, res, db, context) {
    const optOutMsg = getOptOut()
    console.log('Opt-out:', comment.author.name)

    if (context == 0) { //Normal case, user is already present in the DB
        if (!res.optOut) {
            reply(comment, optOutMsg)
            await db.updateOne({ id: comment.author_fullname }, { $set: { optOut: true } })
        } else {
            if (dice(c.OPTOUT_DICE)) { //User has already opted out - only answers 20% of times
                reply(comment, optOutMsg)
            }
        }
    } else if (context == 1) { //Special case, user isn't present in DB but has requested an optOut
        reply(comment, optOutMsg)
        await db.insertOne({ //Add them + optOut
            id: comment.author_fullname,
            name: comment.author.name,
            flair: [flair],
            dateAdded: [new Date()],
            optOut: true
        })
    }
}

//Updates the wall of shame. Post ID is hardcoded
async function wallOfShame(db) {
    let msg = 'EDIT: As of 2022-06-09 opt outs are no longer permitted. This post will stay here as a reminder: there\'s no escape from u/flairchange_bot.\n\nThis is the wall of shame, containing the names of all the cringe users who opted out using the \`!cringe\` command. May their cowardice never be forgotten.\n\n\n'

    console.log('Updating Wall of shame')

    cursor = db.find({ optOut: true }, { sort: { _id: 1 }, projection: { _id: 0, dateAdded: 0, id: 0, optOut: 0 } }) //Run query, returns a cursor (see MongoDB docs)
    await cursor.forEach(item => {
        if (item.flair.length - 1 == 1)
            msg += `- ${item.name}\xa0\xa0\xa0-\xa0\xa0\xa0${item.flair.length - 1} flair change\n\n`
        else
            msg += `- ${item.name}\xa0\xa0\xa0-\xa0\xa0\xa0${item.flair.length - 1} flair changes\n\n`
    })
    msg += `\n*This post is automatically updated every six hours. Last update: ${new Date().toUTCString()}.*`
    r.getSubmission('utwvvg').edit(msg) //Update post
}

//Updates the leaderboard. Post ID is hardcoded
async function leaderboard(db) {
    let msg = 'This is the leaderboard of the most frequent flair changers of r/PoliticalCompassMemes. If your name appears on this list please turn off your computer and go touch some grass. \n\n'

    console.log('Updating Leaderboard')

    cursor = db.aggregate(leaderboardPipe) //Run query, returns a cursor (see MongoDB docs)
    i = 0 //counter needs to be implemented manually, cursor.forEach != array.forEach
    await cursor.forEach(item => {
        if (i >= 20) return //Only show the top 20 (from 0 to 19)
        i++
        msg += `${i}) ${item.name}\xa0\xa0\xa0-\xa0\xa0\xa0${item.size - 1} flair changes\n\n`
    })
    msg += `\n*This post is automatically updated every six hours. Last update: ${new Date().toUTCString()}.*`
    r.getSubmission('uuhlu2').edit(msg) //Update post
}

//Handles the "!flairs" command, checks wether a user is spamming said command or not, calls summonListFlairs if user isn't spamming
function summonListFlairsWrapper(comment, db) {
    const delayMS = c.SUMMON_DELAY * 60000 // [milliseconds]
    let index

    if (callers.find(x => x.id === comment.author_fullname)) { //Is in object...
        if (callers.find(x => x.date.valueOf() + delayMS < new Date())) { //Is in object and matches criteria
            console.log('Summon: YES - In object and match criteria', comment.author.name)

            if (summonListFlairs(comment, db)) { //If param is a reddit username, update in the caller array
                console.log('\tUpdating...')
                index = callers.findIndex(x => x.id === comment.author_fullname)
                callers[index].date = new Date()
            }

        } else { //Is in object and does NOT match criteria
            console.log('Summon: NO - In object and doesn\'t match criteria', comment.author.name)
        }
    } else { //Is not in object, OK
        console.log('Summon: YES - Not in object', comment.author.name)

        if (summonListFlairs(comment, db)) { //If param is a reddit username, push to the caller array
            callers.push({ id: comment.author_fullname, date: new Date() })
        }
    }
}

//Composes a message for the flair history of a user
async function summonListFlairs(comment, db) {
    const regexReddit = /u\/[A-Za-z0-9_-]+/gm //Regex matching a reddit username:A-Z, a-z, 0-9, _, -
    const user = comment.body.match(regexReddit) //Extract username 'u/NAME' from the message, according to the REGEX

    if (user == null) { //If no username was provided exit
        console.log('Tried answering but user', comment.author.name, 'didn\'t enter a reddit username')
        reply(comment, getListFlairsErr(0, c.SUMMON_DELAY))

        return false //WARNING - SPAM: errors aren't counted in the antispam count. Should be fixed if abused
    }

    const username = user[0].slice(2) //Cut 'u/', get RAW username

    log = await db.findOne({ name: username }) //Run query, search for provided username
    if (log == null) {
        console.log('Tried answering but user', comment.author.name, 'didn\'t enter an indexed username')
        reply(comment, getListFlairsErr(1, c.SUMMON_DELAY))
        return false //WARNING - SPAM: errors aren't counted in the antispam count. Should be fixed if abused
    }

    reply(comment, getListFlairs(username, log, c.SUMMON_DELAY)) //Reply!


    return true
}


//AUXILIARY FUNCTIONS - called by secondary functions


//Pushes a new user to the DB
async function newUser(comment, db, flair) {
    await db.insertOne({
        id: comment.author_fullname,
        name: comment.author.name,
        flair: [flair],
        dateAdded: [new Date()]
    })
}

//Checks wether two flairs are adjacent on the Political Compass. True if near, false if not
function isNear(oldF, newF) {
    if (ngbr[oldF].includes(newF))
        return true
    else
        return false
}

//Formats a flairs text
function flairText(comment) {
    let flair = comment.author_flair_text

    if (flair != null) { //If user is NOT unflaired, parse the flair and save it
        if (comment.author_flair_richtext[0].a.slice(1, -1) === 'CENTG') { //Handles alt flairs
            return 'GreyCentrist'

        } else if (comment.author_flair_richtext[0].a.slice(1, -1) === 'libright2') {
            return 'PurpleLibRight'

        } else { //Default case
            return flair.substring(flair.indexOf('-') + 2)
        }
    } else { return null }
}

//Formats a Date (object or text mimicking text) as ISO 8601 compliant YYYY-MM-DD
function getDateStr(param) {
    let date = new Date(param)
    let dateStr = date.getUTCFullYear().toString() + '-' + (date.getUTCMonth() + 1).toString() + '-' + date.getUTCDate().toString() //Composing date using UTC timezone

    return dateStr
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
            return `
    number $ { param }
    `
    }
}


//UTILITY FUNCTIONS - called by anyone


//Rolls a dice. Returns true if a random int in [0 - d] is equal to d => 1/d cases
function dice(d) {
    let rand = Math.floor(Math.random() * d) + 1

    if (d == rand) return true
    else return false
}

//Checks wether a comment is spam: not spam if the last flair change was more than 'FLAIR_CHANGE_DELAY' minutes ago 
function isSpam(res) {
    const delayMS = c.FLAIR_CHANGE_DELAY * 60000 // [milliseconds]
    let now = new Date()

    if (now.valueOf() <= res.dateAdded.at(-1).valueOf() + delayMS) return true
    else return false
}

//Replies to a message, only if DEBUG mode is off
function reply(comment, msg) {
    if (!c.DEBUG) {
        comment.reply(msg)
    } else {
        console.log('DEBUG: Not replying')
    }
}