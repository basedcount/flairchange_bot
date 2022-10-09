import 'dotenv/config';
import { CommentStream } from 'snoostorm'
import cron from 'node-cron'
import Snoowrap from 'snoowrap'
import { MongoClient } from 'mongodb'

import noFlair from './modules/unflaired.js'
import ngbr from './modules/neighbour.js'
import { getFlair, getGrass, getUnflaired, getOptOut, getListFlairs, getListFlairsErr } from './modules/strings.js'
import c from './modules/const.js'

const uri = process.env.MONGODB_URI
const basedUri = process.env.BASED_URI

const client = new MongoClient(uri)
const basedClient = new MongoClient(basedUri)
const r = new Snoowrap({
    userAgent: 'flairchange_bot v2.4.0; A bot detecting user flair changes, by u/Nerd02',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS
})
const stream = new CommentStream(r, {
    subreddit: 'PoliticalCompassMemes',
    results: 1
})

const blacklist = ['flairchange_bot', 'SaveVideo', 'eazeaze']
let callers = Array() //Array containing the callers who used the "!flairs" command, antispam

run()

//Main function
function run() {
    client.connect()
    basedClient.connect()

    const db = client.db('flairChangeBot').collection('users')
    const based = basedClient.db('dataBased').collection('users')

    console.log('Starting up...')
    if (c.DEBUG) console.log('Warning, DEBUG mode is ON')

    if (!c.DEBUG) {
        cron.schedule('0 */6 * * *', () => { //Task executed every six hours, UTC timezone, only if debug mode is off
            leaderboard() //Updates Leaderboard instantly
            setTimeout(() => { //Updates Wall of shame after 10 seconds, avoids RATELIMIT
                wallOfShame(db)
            }, 10000)
        }, { timezone: 'UTC' })
    }

    stream.on('item', async comment => {
        if (blacklist.includes(comment.author.name)) return //Comment made by the bot itself, no time to lose here

        try {
            let flair = flairText(comment);

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
                } else if (flair === null && (res.flairs.at(-1).flair == 'null' || res.flairs.at(-1).flair == 'Unflaired')) { //Unflaired, is in DB and is a registered unflaired
                    unflaired(comment)

                } else if (flair === null && res.flairs.at(-1).flair != flair) { //Is in DB but switched to unflaired
                    flairChangeUnflaired(comment, res, db)

                } else if (res.flairs.at(-1).flair != flair) { //Already present in DB and flair change
                    flairChange(comment, db, flair, res)

                } else { //Generic comment
                    if (comment.body.includes('!cringe')) {
                        optOut(comment, res, db, 0)
                    }
                }
            })
        } catch (e) { console.log(e.toString()) } finally {

            if (comment.body.includes('!flairs') && !comment.body.includes('!flairs u/<name>')) { //The bot was summoned using the "!flairs" command
                setTimeout(() => {
                        summonListFlairsWrapper(comment, db, based)
                    }, 10000) //Wait 10 seconds (in case of both flair change and summon, avoid ratelimit)
            }
        }
    })
}


//SECONDARY FUNCTIONS - called by the main function


//Handles all flair change instances
async function flairChange(comment, db, newF, res) {
    let oldF = res.flairs.at(-1).flair
    let dateStr = getDateStr(res.flairs.at(-1).dateAdded)
    let msg = getFlair(comment.author.name, oldF, dateStr, newF)

    console.log('Flair change!', comment.author.name, 'was', oldF, 'now is', newF)

    if (!isSpam(res)) { //If user isn't spamming, push to DB, send message, 
        db.updateOne({ id: comment.author_fullname }, { $push: { flairs: { 'flair': newF, 'dateAdded': new Date() } } }, err => { if (err) throw err })

        if (oldF == 'null' || oldF == 'Unflaired') { //If user went unflaired and has now flaired up don't send any message
            return

        } else {
            let ldb = await client.db('flairChangeBot').collection('leaderboard').findOne({ id: res.id }) //Leaderboard position (top 500), if any

            if (ldb != null) { //User is on the leaderboard (touch grass)
                if (ldb.position <= c.LEADERBOARD_CNG) {  //Separate check, it breaks if they are checked together (can't get position of undefined) 
                    let ratingN = card2ord(ldb.position) //Get ordinal number ('second', 'third'...)

                    msg = getGrass(comment.author.name, oldF, dateStr, newF, ldb.size, ratingN)
                    console.log('\tNot a grass toucher', comment.author.name)

                    reply(comment, msg)
                    return
                }
            } 
            //Regular message or user on leaderboard but below LEADERBOARD_CNG

            let near = isNear(oldF, newF)
            if (near && percentage(c.NEIGHBOUR_PTG)) { //If flairs are neighbouring. Only answers a percentage of times, ends every other time
                console.log('\tNeighbour, posting')
            } else if (near) {
                console.log('\tNeighbour, not posting')
                return
            } else {
                console.log('\tNot neighbour')
            }

            reply(comment, msg)
        }
    } else { //Spam. Doesn't push to DB
        console.log('Tried answering but user', comment.author.name, 'is spamming')
    }
}

//Detects changes from any flair to unflaired. Toggles the 'unflaired' attribute in the DB
async function flairChangeUnflaired(comment, res, db) {
    console.log('Flair change!', comment.author.name, 'was', res.flairs.at(-1).flair, 'now is UNFLAIRED')
    if (!isSpam(res)) {
        let dateStr = getDateStr(res.flairs.at(-1).dateAdded)
        let msg = getUnflaired(comment.author.name, res.flairs.at(-1).flair, dateStr)

        db.updateOne({ id: res.id }, { $push: { flairs: { 'flair': 'Unflaired', 'dateAdded': new Date() } } })

        reply(comment, msg)

    } else { //Spam. Doesn't push to DB
        console.log('Tried answering but user', comment.author.name, 'is spamming')
    }
}

//Sends a random message reminding users to flair up. Only answers in a percentage of cases
function unflaired(comment) {
    if (comment == undefined) return //No clue why this happens. Probably insta-deleted comments

    let rand = Math.floor(Math.random() * noFlair.length)

    if (percentage(c.UNFLAIRED_PTG)) {
        console.log(`Unflaired: ${comment.author.name}`)
        reply(comment, noFlair[rand])
    }
}

//[DEPRECATED] Handles optOut requests. Params: comment object, result returned from DB query, database object, context: 0: user already present, 1: user not present
async function optOut(comment, res, db, context) {
    const optOutMsg = getOptOut()
    console.log('Opt-out:', comment.author.name)

    if (context == 0) { //Normal case, user is already present in the DB
        if (!res.optOut) {
            reply(comment, optOutMsg)
            db.updateOne({ id: comment.author_fullname }, { $set: { optOut: true } })
        } else {
            if (percentage(c.OPTOUT_PTG)) { //User has already opted out - only answers a percentage of times
                reply(comment, optOutMsg)
            }
        }
    } else if (context == 1) { //Special case, user isn't present in DB but has requested an optOut
        reply(comment, optOutMsg)
        await db.insertOne({ //Add them + optOut
            id: comment.author_fullname,
            name: comment.author.name,
            flairs: [{
                'flair': flairText(comment),
                'dateAdded': new Date()
            }],
            optOut: true
        })
    }
}

//Updates the wall of shame. Post ID is hardcoded
async function wallOfShame(db) {
    let msg = 'EDIT: As of 2022-06-09 opt outs are no longer permitted. This post will stay here as a reminder: there\'s no escape from u/flairchange_bot.\n\nThis is the wall of shame, containing the names of all the cringe users who opted out using the \`!cringe\` command. May their cowardice never be forgotten.\n\n\n'

    console.log('Updating Wall of shame')

    let cursor = db.find({ optOut: true }, { sort: { _id: 1 }, projection: { _id: 0, name: 1, flairs: 1 } })
    await cursor.forEach(item => {
        if (item.flairs.length - 1 == 1)
            msg += `- ${item.name}\xa0\xa0\xa0-\xa0\xa0\xa0${item.flairs.length - 1} flair change\n\n`
        else
            msg += `- ${item.name}\xa0\xa0\xa0-\xa0\xa0\xa0${item.flairs.length - 1} flair changes\n\n`
    })
    msg += `\n*This post is automatically updated every six hours. Last update: ${new Date().toUTCString()}.*`
    r.getSubmission('utwvvg').edit(msg) //Update post
}

//Updates the leaderboard. Post ID is hardcoded
async function leaderboard() {
    let msg = 'This is the leaderboard of the most frequent flair changers of r/PoliticalCompassMemes. If your name appears on this list please turn off your computer and go touch some grass. \n\n'

    console.log('Updating Leaderboard')

    let cursor = client.db('flairChangeBot').collection('leaderboard').find()

    let i = 0 //counter needs to be implemented manually, cursor.forEach != array.forEach
    await cursor.forEach(item => {
        if (i >= c.LEADERBOARD_POST) return //Only show the top LEADERBOARD_POST
        i++
        msg += `${i}) ${item.name}\xa0\xa0\xa0-\xa0\xa0\xa0${item.size - 1} flair changes\n\n`
    })
    msg += `\n*This post is automatically updated every six hours. Last update: ${new Date().toUTCString()}.*`
    r.getSubmission('uuhlu2').edit(msg) //Update post
}

//Handles the "!flairs" command, checks wether a user is spamming said command or not, calls summonListFlairs if user isn't spamming.
//Callers are saved in a 'callers' object array, along with the timestamp of their last call
function summonListFlairsWrapper(comment, db, based) {
    const delayMS = c.SUMMON_DELAY * 60000 // [milliseconds]
    let index

    if (callers.find(x => x.id === comment.author_fullname)) { //Is in object...
        if (callers.find(x => x.date.valueOf() + delayMS < new Date())) { //Is in object but isn't spamming
            console.log('Summon: YES - In object and match criteria', comment.author.name)

            if (summonListFlairs(comment, db, based)) { //If param is a reddit username, update in the caller array
                console.log('\tUpdating...')
                index = callers.findIndex(x => x.id === comment.author_fullname)
                callers[index].date = new Date()
            }

        } else { //Is in object and is spamming
            console.log('Summon: NO - In object and doesn\'t match criteria', comment.author.name)
        }
    } else { //Is not in object, OK
        console.log('Summon: YES - Not in object', comment.author.name)

        if (summonListFlairs(comment, db, based)) { //If param is a reddit username, push to the caller array
            callers.push({ id: comment.author_fullname, date: new Date() })
        }
    }
}

//Composes a message for the flair history of a user. Returns true if succesful, false on an error
async function summonListFlairs(comment, db, based) {
    const regexReddit = /u\/[A-Za-z0-9_-]+/gm //Regex matching a reddit username:A-Z, a-z, 0-9, _, -
    const user = comment.body.match(regexReddit) //Extract username 'u/NAME' from the message, according to the REGEX

    if (user == null) { //If no username was provided exit
        console.log('Tried answering but user', comment.author.name, 'didn\'t enter a reddit username')
        reply(comment, getListFlairsErr(0, c.SUMMON_DELAY))

        return false //WARNING - SPAM: errors aren't counted in the antispam count. Should be fixed if abused
    }

    let username

    if (user == 'u/me') { //Handles u/me param
        username = comment.author.name

    } else {
        username = user[0].slice(2) //Cut 'u/', get RAW username
    }

    let log = await db.findOne({ name: { $regex: new RegExp(username, 'i') } }) //Run query, search for provided username - REGEX makes it case insensitive
    if (log == null) {
        console.log('Tried answering but user', comment.author.name, 'didn\'t enter an indexed username')
        reply(comment, getListFlairsErr(1, c.SUMMON_DELAY))
        return false //WARNING - SPAM: errors aren't counted in the antispam count. Should be fixed if abused
    }
    // let pills = await isBased(username, based) //Get the number of pills (if any)

    reply(comment, getListFlairs(username, log, c.SUMMON_DELAY)) //Reply!

    return true
}


//AUXILIARY FUNCTIONS - called by secondary functions


//Pushes a new user to the DB
async function newUser(comment, db, flair) {
    db.insertOne({
        id: comment.author_fullname,
        name: comment.author.name,
        flairs: [{
            'flair': flair,
            'dateAdded': new Date()
        }]
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
        if (flair == undefined) {
            throw `Undefined flair exception: ${comment.author.name}`
        }

        if (flair.substring(1, flair.indexOf('-') - 2) == 'CENTG') { //Handles alt flairs
            return 'GreyCentrist'

        } else if (flair.substring(1, flair.indexOf('-') - 2) == 'libright2') {
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


//UTILITY FUNCTIONS - called by anyone


//Converts a cardinal number(int) to an ordinal one (string), 1 to 20. Doesn't do anything for bigger numbers
function card2ord(param) {
    let nums = ['', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth', 'twentieth']
    if (param > nums.length) return `number ${param}`
    else return nums[param - 1]
}

//RNG. Returns true n% of times, returns false otherwise
function percentage(n) {
    let rand = Math.floor(Math.random() * 100)

    if (rand < n) return true
    else return false
}

//Checks wether a comment is spam: not spam if the last flair change was more than 'FLAIR_CHANGE_DELAY' minutes ago 
function isSpam(res) {
    const delayMS = c.FLAIR_CHANGE_DELAY * 60000 // [milliseconds]
    let now = new Date()

    if (now.valueOf() <= res.flairs.at(-1).dateAdded.valueOf() + delayMS) return true
    else return false
}

//Replies to a message, only if DEBUG mode is off
function reply(comment, msg) {
    if (!c.DEBUG) {
        comment.reply(msg)
    } else {
        console.log(`DEBUG:\n${msg}`)
    }
}

//[DEPRECATED] Returns 0 if a user is not based (and has pills), returns their number of pills if they are
async function isBased(username, based) {
    const pipe = [{
        $match: { pills: { $not: { $size: 0 } }, name: username }
    }, {
        $project: { _id: 0, pills: { $size: '$pills' } }
    }]

    const output = await based.aggregate(pipe).toArray()

    if (output.length == 0) return 0
    else return output[0].pills
}