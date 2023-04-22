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
import { getFlair, getGrass, getUnflaired, getListFlairs, getListFlairsErr, getFooterUnflaired } from './modules/strings.js';
import c from './modules/const.js'
import { Flair, FlairDB, getFlairList, checkNewFlairs } from './modules/flairList.js';

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri as string);

/*
    This script uses two Reddit accounts: u/flairchange_bot and u/flairstealth_bot
    The former only posts on Reddit, the latter lurks and only reads from Reddit
    This allows us to track users who have blocked flairchange_bot (without responding to them)
*/
const userAgent = 'flairchange_bot v3.3.3; A bot detecting user flair changes, by u/Nerd02'
const r = new Snoowrap({    //flairchange_bot, out facing client
    userAgent,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS
});
const s = new Snoowrap({    //flairstealth_bot, lurking, stealthy client
    userAgent,
    clientId: process.env.STEALTH_CLIENT_ID,
    clientSecret: process.env.STEALTH_CLIENT_SECRET,
    username: process.env.STEALTH_REDDIT_USER,
    password: process.env.STEALTH_REDDIT_PASS
});
const stream = new CommentStream(s, {
    subreddit: 'PoliticalCompassMemes',
});

const blacklist = ['flairchange_bot', 'SaveVideo', 'eazeaze'];
const callers: Array<Caller> = []; //Array containing the callers who used the "!flairs" command, antispam

run();

//Main function
async function run() {
    client.connect();

    const db = client.db('flairChangeBot').collection<User>('users');
    const flairdb = client.db('flairChangeBot').collection<FlairDB>('flairs');

    console.log('Starting up...');
    if (c.DEBUG) console.log('Warning, DEBUG mode is ON');

    await checkNewFlairs(r, flairdb);
    let flairList = await getFlairList(flairdb, []);

    cron.schedule('0 * * * *', async () => {
        console.log('Refreshing flair list');
        await checkNewFlairs(r, flairdb);
        flairList = await getFlairList(flairdb, flairList);
    });

    cron.schedule('0 0 * * * ', () => {
        console.log('Resetting !flairs callers');
        callers.length = 0; //Empty the callers array (avoid memory leaks)
    });

    stream.on('item', async comment => {
        if (blacklist.includes(comment.author.name)) return //Comment made by the bot itself, no time to lose here

        try {
            const flair = flairText(comment, flairList);

            db.findOne({ id: comment.author_fullname }, async (err, res) => { //Check for any already present occurrence
                if (err) throw err
                if (res === undefined) throw err;

                if (flair === 'Unflaired' && res === null) { //Unflaired and not in DB
                    unflaired(comment)

                } else if (res === null) { //Flaired, not in DB
                    newUser(comment, db, flair)

                } else if (flair === 'Unflaired' && res.flairs.at(-1)?.flair == 'Unflaired') { //Unflaired, is in DB and is a registered unflaired
                    unflaired(comment)

                } else if (flair === 'Unflaired' && res.flairs.at(-1)?.flair != flair) { //Is in DB but switched to unflaired
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
                    console.log(`\tUser is in the top ${c.LEADERBOARD_CNG}. Touch some grass`)

                    reply(comment, msg)
                    return
                }
            }
            //Regular message or user on leaderboard but below LEADERBOARD_CNG

            const near = isNear(oldF, newF)
            if (near && percentage(c.NEIGHBOUR_PTG)) { //If flairs are neighbouring. Only answers a percentage of times, ends every other time
                console.log('\tMinor shift but passed roll: posting')
            } else if (near) {
                console.log('\tMinor shift: not posting')
                return
            } else {
                console.log('\tMajor shift: posting')
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
async function unflaired(comment: Snoowrap.Comment) {
    if (comment == undefined) return; //No clue why this happens. Probably insta-deleted comments

    const rand = Math.floor(Math.random() * noFlair.length);

    if (percentage(c.UNFLAIRED_PTG)) {
        console.log(`Unflaired: ${comment.author.name}`);

        if (await userExists(comment.author.name)) {
            reply(comment, noFlair[rand] + getFooterUnflaired(comment.author.name));

        } else {
            reply(comment, noFlair[rand] + getFooterUnflaired(null));

        }
    }
}

//Handles the "!flairs" command, checks wether a user is spamming said command or not, calls summonListFlairs if user isn't spamming.
//Callers are saved in a 'callers' object array, along with the timestamp of their last call
async function summonListFlairsWrapper(comment: Snoowrap.Comment, db: Collection<User>) {
    const delayMS = c.SUMMON_DELAY * 60000; // [milliseconds]
    let index;

    if (callers.find(x => x.id === comment.author_fullname)) { //Is in object...
        if (callers.find(x => x.date.valueOf() + delayMS < new Date().valueOf())) { //Is in object but isn't spamming
            console.log('!flairs request GRANTED. User:', comment.author.name);

            if (await summonListFlairs(comment, db)) { //If param is a reddit username, update in the caller array
                console.log('\tUpdating anti spam filter');
                index = callers.findIndex(x => x.id === comment.author_fullname);
                callers[index].date = new Date();
            }

        } else { //Is in object and is spamming
            console.log('!flairs request REJECTED (spam). User:', comment.author.name);
        }
    } else { //Is not in object, OK
        console.log('!flairs request GRANTED. User:', comment.author.name);

        const target = await summonListFlairs(comment, db);
        if (target !== null) { //If param is a reddit username, push to the caller array
            console.log('\tTarget:', target);
            callers.push({ id: comment.author_fullname, date: new Date() });
        }
    }
}

//Composes a message for the flair history of a user. Returns true if succesful, false on an error
async function summonListFlairs(comment: Snoowrap.Comment, db: Collection<User>) {
    const regexReddit = /u\/[A-Za-z0-9_-]+/gm; //Regex matching a reddit username:A-Z, a-z, 0-9, _, -
    const user = comment.body.match(regexReddit); //Extract username 'u/NAME' from the message, according to the REGEX

    if (user == null) { //If no username was provided exit
        console.log('Tried answering but user', comment.author.name, 'didn\'t enter a reddit username');
        reply(comment, getListFlairsErr(0, c.SUMMON_DELAY));

        return null; //WARNING - SPAM: errors aren't counted in the antispam count. Should be fixed if abused
    }

    let username;

    if (user.toString().toLowerCase() === 'u/me') { //Handles u/me param
        username = comment.author.name;
    } else {
        username = user[0].slice(2); //Cut 'u/', get RAW username
    }

    const log = await db.findOne({ name: { $regex: new RegExp(username, 'i') } }); //Run query, search for provided username - REGEX makes it case insensitive
    if (log == null) {
        console.log('Tried answering but user', comment.author.name, 'didn\'t enter an indexed username');
        reply(comment, getListFlairsErr(1, c.SUMMON_DELAY));
        return null; //WARNING - SPAM: errors aren't counted in the antispam count. Should be fixed if abused
    }

    reply(comment, getListFlairs(username, log, c.SUMMON_DELAY)); //Reply!

    return username;
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

    return flair.flair;
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

//Checks whether a user exists in the basedcount API (flairchange_bot | basedcount_bot)
async function userExists(name: string) {
    const res = await fetch(`https://basedcount.com/api/user/${name}`, { method: "HEAD" });
    return res.ok;
}

//Replies to a message, only if DEBUG mode is off
async function reply(stealth_comment: Snoowrap.Comment, msg: string) {
    try {
        const id = stealth_comment.id;  //Target comment id, from stealth client s
        const commentFlairBot = r.getComment(id);
        const authorFlairBot = await commentFlairBot.author.name;

        //If the name fetched by s doesn't match the one fetched by r the latter, it probably means that the user
        //has blocked flairchange_bot. Don't reply.
        //NOTE: this fixes a Reddit issue that allows the bot to reply to people who have blocked it
        if (stealth_comment.author.name === authorFlairBot) {
            if (!c.DEBUG) {
                commentFlairBot.reply(msg);
            } else {
                console.log(`DEBUG:\n${msg}`);
            }
        } else {
            console.log('Tried answering but user', stealth_comment.author.name, 'has blocked the bot');
        }
    } catch (e) {
        console.log(e);
    }
}
