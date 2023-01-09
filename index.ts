import 'dotenv/config';
import { CommentStream } from 'snoostorm';
import Snoowrap from 'snoowrap';
import { MongoClient } from 'mongodb';
import cron from 'node-cron';

import type { Collection, WithId } from 'mongodb';
import type { User } from './types/user.js';
import type { Caller } from './types/caller.js';
import type { LeaderboardUser } from './types/leaderboard.js';

import noFlair from './modules/unflaired.js';
import ngbr from './modules/neighbour.js';
import { getFlair, getGrass, getUnflaired, getListFlairs, getListFlairsErr } from './modules/strings.js';
import c from './modules/const.js'
import { Flair, getFlairList } from './modules/flairList.js';

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri as string);
const r = new Snoowrap({
    userAgent: 'flairchange_bot v3.1.1; A bot detecting user flair changes, by u/Nerd02',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS
});
const stream = new CommentStream(r, {
    subreddit: 'PoliticalCompassMemes',
});

const blacklist = ['flairchange_bot', 'SaveVideo', 'eazeaze'];
const callers: Array<Caller> = []; //Array containing the callers who used the "!flairs" command, antispam

run();

//Main function
async function run() {
    let flairList: Array<Flair> = await getFlairList(r);
    client.connect()

    const db = client.db('flairChangeBot').collection<User>('users')

    console.log('Starting up...')
    if (c.DEBUG) console.log('Warning, DEBUG mode is ON')

    cron.schedule('0 * * * *', async () => {
        console.log('Refreshing flair list');
        flairList = await getFlairList(r);
    });

    stream.on('item', async comment => {
        if (blacklist.includes(comment.author.name)) return //Comment made by the bot itself, no time to lose here

        try {
            const flair = flairText(comment, flairList);

            db.findOne({ id: comment.author_fullname }, async (err, res) => { //Check for any already present occurrence
                if (err) throw err
                if (res === undefined) throw err;

                if (flair === null && res === null) { //Unflaired and not in DB
                    unflaired(comment)

                } else if (res === null) { //Flaired, not in DB
                    newUser(comment, db, flair)

                } else if (flair === null && res.flairs.at(-1)?.flair == 'Unflaired') { //Unflaired, is in DB and is a registered unflaired
                    unflaired(comment)

                } else if (flair === null && res.flairs.at(-1)?.flair != flair) { //Is in DB but switched to unflaired
                    flairChangeUnflaired(comment, res, db)

                } else if (res.flairs.at(-1)?.flair != flair) { //Already present in DB and flair change
                    flairChange(comment, db, flair, res)

                }
            })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) { console.log(e.toString()) } finally {

            if (comment.body.includes('!flairs') && !comment.body.includes('!flairs u/<name>')) { //The bot was summoned using the "!flairs" command
                setTimeout(() => {
                    summonListFlairsWrapper(comment, db)
                }, 10000) //Wait 10 seconds (in case of both flair change and summon, avoid ratelimit)
            }
        }
    })
}


//SECONDARY FUNCTIONS - called by the main function


//Handles all flair change instances
async function flairChange(comment: Snoowrap.Comment, db: Collection<User>, newF: string, res: WithId<User>) {
    const oldF = res.flairs.at(-1)?.flair as string
    const dateStr = getDateStr(res.flairs.at(-1)?.dateAdded as Date)
    let msg = getFlair(comment.author.name, oldF, dateStr, newF)

    console.log('Flair change!', comment.author.name, 'was', oldF, 'now is', newF)

    if (!isSpam(res)) { //If user isn't spamming, push to DB, send message, 
        db.updateOne({ id: comment.author_fullname }, { $push: { flairs: { 'flair': newF, 'dateAdded': new Date() } } }, err => { if (err) throw err })

        if (oldF == 'Unflaired') { //If user went unflaired and has now flaired up don't send any message
            return

        } else {
            const ldb = await client.db('flairChangeBot').collection<LeaderboardUser>('leaderboard').findOne({ id: res.id }) //Leaderboard position (top 500), if any

            if (ldb != null) { //User is on the leaderboard (touch grass)
                if (ldb.position <= c.LEADERBOARD_CNG) {  //Separate check, it breaks if they are checked together (can't get position of undefined) 
                    const ratingN = card2ord(ldb.position) //Get ordinal number ('second', 'third'...)

                    msg = getGrass(comment.author.name, oldF, dateStr, newF, ldb.size, ratingN)
                    console.log('\tNot a grass toucher', comment.author.name)

                    reply(comment, msg)
                    return
                }
            }
            //Regular message or user on leaderboard but below LEADERBOARD_CNG

            const near = isNear(oldF, newF)
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

//Detects changes from any flair to unflaired.
async function flairChangeUnflaired(comment: Snoowrap.Comment, res: WithId<User>, db: Collection<User>) {
    console.log('Flair change!', comment.author.name, 'was', res.flairs.at(-1)?.flair, 'now is UNFLAIRED')
    if (!isSpam(res)) {
        const dateStr = getDateStr(res.flairs.at(-1)?.dateAdded as Date)
        const msg = getUnflaired(comment.author.name, res.flairs.at(-1)?.flair as string, dateStr)

        db.updateOne({ id: res.id }, { $push: { flairs: { 'flair': 'Unflaired', 'dateAdded': new Date() } } })

        reply(comment, msg)

    } else { //Spam. Doesn't push to DB
        console.log('Tried answering but user', comment.author.name, 'is spamming')
    }
}

//Sends a random message reminding users to flair up. Only answers in a percentage of cases
function unflaired(comment: Snoowrap.Comment) {
    if (comment == undefined) return //No clue why this happens. Probably insta-deleted comments

    const rand = Math.floor(Math.random() * noFlair.length)

    if (percentage(c.UNFLAIRED_PTG)) {
        console.log(`Unflaired: ${comment.author.name}`)
        reply(comment, noFlair[rand])
    }
}

//Handles the "!flairs" command, checks wether a user is spamming said command or not, calls summonListFlairs if user isn't spamming.
//Callers are saved in a 'callers' object array, along with the timestamp of their last call
async function summonListFlairsWrapper(comment: Snoowrap.Comment, db: Collection<User>) {
    const delayMS = c.SUMMON_DELAY * 60000 // [milliseconds]
    let index

    if (callers.find(x => x.id === comment.author_fullname)) { //Is in object...
        if (callers.find(x => x.date.valueOf() + delayMS < new Date().valueOf())) { //Is in object but isn't spamming
            console.log('Summon: YES - In object and match criteria', comment.author.name)

            if (await summonListFlairs(comment, db)) { //If param is a reddit username, update in the caller array
                console.log('\tUpdating...')
                index = callers.findIndex(x => x.id === comment.author_fullname)
                callers[index].date = new Date()
            }

        } else { //Is in object and is spamming
            console.log('Summon: NO - In object and doesn\'t match criteria', comment.author.name)
        }
    } else { //Is not in object, OK
        console.log('Summon: YES - Not in object', comment.author.name)

        if (await summonListFlairs(comment, db)) { //If param is a reddit username, push to the caller array
            callers.push({ id: comment.author_fullname, date: new Date() })
        }
    }
}

//Composes a message for the flair history of a user. Returns true if succesful, false on an error
async function summonListFlairs(comment: Snoowrap.Comment, db: Collection<User>) {
    const regexReddit = /u\/[A-Za-z0-9_-]+/gm //Regex matching a reddit username:A-Z, a-z, 0-9, _, -
    const user = comment.body.match(regexReddit) //Extract username 'u/NAME' from the message, according to the REGEX

    if (user == null) { //If no username was provided exit
        console.log('Tried answering but user', comment.author.name, 'didn\'t enter a reddit username')
        reply(comment, getListFlairsErr(0, c.SUMMON_DELAY))

        return false //WARNING - SPAM: errors aren't counted in the antispam count. Should be fixed if abused
    }

    let username

    if (user.toString().toLowerCase() === 'u/me') { //Handles u/me param
        username = comment.author.name
    } else {
        username = user[0].slice(2) //Cut 'u/', get RAW username
    }

    const log = await db.findOne({ name: { $regex: new RegExp(username, 'i') } }) //Run query, search for provided username - REGEX makes it case insensitive
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
async function newUser(comment: Snoowrap.Comment, db: Collection<User>, flair: string) {
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
function isNear(oldF: string, newF: string) {
    if (oldF.includes('Chad') || newF.includes('Chad')) return false

    const keys = Object.keys(ngbr);
    const values = Object.values(ngbr);
    if (values[keys.indexOf(oldF)].includes(newF)) return true;
    else return false
}

//Formats a flairs text
function flairText(comment: Snoowrap.Comment, flairList: Flair[]) {
    const id = comment.author_flair_template_id;

    if (id === null || id === undefined) return 'Unflaired';

    const flair = flairList.find(flair => (flair.id === id));

    if (flair === undefined) {  //Flair not saved in wiki
        const text = comment.author_flair_text;
        if (text === null) return 'Unflaired';  //ID not null, text null. Very unlikely

        return text.substring(text.indexOf('-') + 2);   //Legacy flair name extraction
    }

    return flair.name;
}

//Formats a Date (object or text mimicking text) as ISO 8601 compliant YYYY-MM-DD
function getDateStr(param: Date) {
    const date = new Date(param)
    const dateStr = date.getUTCFullYear().toString() + '-' + (date.getUTCMonth() + 1).toString() + '-' + date.getUTCDate().toString() //Composing date using UTC timezone

    return dateStr
}


//UTILITY FUNCTIONS - called by anyone


//Converts a cardinal number(int) to an ordinal one (string), 1 to 20. Doesn't do anything for bigger numbers
function card2ord(param: number) {
    const nums = ['', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth', 'twentieth']
    if (param > nums.length) return `number ${param}`
    else return nums[param - 1]
}

//RNG. Returns true n% of times, returns false otherwise
function percentage(n: number) {
    const rand = Math.floor(Math.random() * 100)

    if (rand < n) return true
    else return false
}

//Checks wether a comment is spam: not spam if the last flair change was more than 'FLAIR_CHANGE_DELAY' minutes ago 
function isSpam(res: WithId<User>) {
    const delayMS = c.FLAIR_CHANGE_DELAY * 60000 // [milliseconds]
    const now = new Date()

    if (now.valueOf() <= (res.flairs.at(-1)?.dateAdded as Date).valueOf() + delayMS) return true
    else return false
}

//Replies to a message, only if DEBUG mode is off
function reply(comment: Snoowrap.Comment, msg: string) {
    if (!c.DEBUG) {
        comment.reply(msg)
    } else {
        console.log(`DEBUG:\n${msg}`)
    }
}
