import c from "./const.js"

import type { WithId } from 'mongodb';
import type { User, Flair } from "../types/user.js";

const strings = {
    // outro: `\n\n*"You have the right to change your mind, as I have the right to shame you for doing so." - Anonymous*`, //unused
    footer: `[FAQ](https://www.reddit.com/user/flairchange_bot/comments/uf7kuy/bip_bop) - [Leaderboard](https://basedcount.com/leaderboard?q=flairs)\n\n_Reddit is no longer a friendly space for bots._  \n_Consider visiting our Lеmmу instance instead: [forum.basedcount.com](https://forum.basedcount.com/c/pcm)._  \n_Read my full statement [here](https://www.reddit.com/user/flairchange_bot/comments/14mwml0/on_the_reddit_api_changes/)._\n\n^(I am a bot, my mission is to spot cringe flair changers. If you want to check another user's flair history write) **^(!flairs u/<name>)** ^(in a comment.)`,
    unflairedChangeOutro: `\n\nYou are beyond cringe, you are disgusting and deserving of all the downvotes you are going to get. Repent now and pick a new flair before it's too late.`,
    // optOut: `You are both cringe and a coward, however [I no longer offer opt outs](https://www.reddit.com/user/flairchange_bot/comments/v8f90t/about_the_opt_out_feature/?utm_source=share&utm_medium=web2x&context=3).  \nI'll keep bothering you as much as I do with any other user. Sorry, not sorry.`, //unused
    flairsFCBot: `Nothing to see here. Always been AuthCenter, always will. I'm no flair changer.\n\nDon't bother asking what went down on April 1st 2023, nothing of significance happened on that day.`,
    flairsBCBot: `You leave my good friend u/basedcount_bot out of this! He's a good guy, not some dirty flair changer.`,
    flairsUNFLAIRED: `The name which you ask about is that of an unflaired, give them no attention. Simply know that they've been an unflaired for most of their miserable, flairless life.`,
    footerUnflaired: "[FAQ](https://www.reddit.com/user/flairchange_bot/comments/uf7kuy/bip_bop) - [How to flair](https://www.reddit.com/r/PoliticalCompassMemes/wiki/index/flair/)\n\n_Reddit is no longer a friendly space for bots._  \n_Consider visiting our Lеmmу instance instead: [forum.basedcount.com](https://forum.basedcount.com/c/pcm)._  \n_Read my full statement [here](https://www.reddit.com/user/flairchange_bot/comments/14mwml0/on_the_reddit_api_changes/)._\n\n^(I am a bot, my mission is to spot cringe flair changers. If you want to check another user's flair history write) **^(!flairs u/<name>)** ^(in a comment.)"
}

const ins = {
    AuthRight: "\n\nRemember, the jannies are always watching. No gamer words, no statistics and by all means no wood cutting machines. Tell us, how are you going to flair the new account you'll make in two weeks?",
    Right: "\n\nNo, me targeting you is not part of a conspiracy. And no, your flair count is not rigged. Stop listening to QAnon or the Orange Man and come out of that basement.",
    LibRight: "\n\nAre you mad? Wait till you hear this one: you own 17 guns but only have two hands to use them! Come on, put that rifle down and go take a shower.",
    "Purple LibRight": "\n\nNow come on, put your pants back on and go outside, you dirty degen.  \nNo wait, not that way. There's a school over there!",
    LibCenter: "\n\nWait, those were too many words, I'm sure. Maybe you'll understand this, monke: \"oo oo aah YOU CRINGE ahah ehe\".",
    LibLeft: "\n\nYeah yeah, I know. In your ideal leftist commune everyone loves each other and no one insults anybody. Guess what? Welcome to the real world. What are you gonna do? Cancel me on twitter?",
    Left: "\n\nIf Orange was a flair you probably would have picked that, am I right? You watermelon-looking snowflake.",
    AuthLeft: "\n\nWhat? You are hungry? You want food? I fear you've chosen the wrong flair, comrade.",
    AuthCenter: "\n\nThat being said... Based and fellow Auth pilled, welcome home.",
    Centrist: "\n\nTell us, are you scared of politics in general or are you just too much of a coward to let everyone know what you think?",
    "Grey Centrist": "\n\nActually nevermind, you are good. Not having opinions is still more based than having dumb ones. Happy grilling, brother."
}

//String for regular flair changes
function getFlair(author: string, flairOld: string, dateStr: string, flairNew: string) {
    const intro = `Did you just change your flair, u/${author}? Last time I checked you were ${flairArticled(flairOld)} on ${dateStr}. How come now you are ${flairArticled(flairNew)}? Have you perhaps shifted your ideals? Because that's cringe, you know?`;
    const profileLink = `\n\n[BasedCount Profile](https://basedcount.com/u/${author}) - `;  //Can't include in footer because it's dynamic

    if (flairOld.includes('Chad')) {  //Chad -> regular flair
        const oldChad = '\n\nNo chad rules forever, friend. We salute a fallen chad and welcome a new one.';
        return intro + oldChad + profileLink + strings.footer;
    } else if (flairNew.includes('Chad')) {   //Regular flair -> chad
        const newChad = '\n\nRejoice, PCM! All hail the new chad! We wish great memes and a many based to come your way.';
        return intro + newChad + profileLink + strings.footer;
    }

    const keys = Object.keys(ins);
    const values = Object.values(ins);

    return intro + values[keys.indexOf(flairNew)] + profileLink + strings.footer;   //Default case
}

//String for top flair changers (needs to touch grass)
function getGrass(author: string, flairOld: string, dateStr: string, flairNew: string, size: number, pos: string) {
    const intro = `Did you just change your flair, u/${author}? Last time I checked you were ${flairArticled(flairOld)} on ${dateStr}. How come now you are ${flairArticled(flairNew)}? Have you perhaps shifted your ideals? Because that's cringe, you know?`
    const grass = `\n\nOh and by the way. You have already changed your flair ${size} times, making you the ${pos} largest flair changer in this sub.\nGo touch some fucking grass.`
    const profileLink = `\n\n[BasedCount Profile](https://basedcount.com/u/${author}) - `;  //Can't include in footer because it's dynamic

    if (flairOld.includes('Chad')) {  //Chad -> regular flair
        const oldChad = '\n\nNo chad rules forever, friend. We salute a fallen chad and welcome a new one.';
        return intro + oldChad + grass + profileLink + strings.footer;
    } else if (flairNew.includes('Chad')) {   //Regular flair -> chad
        const newChad = '\n\nRejoice, PCM! All hail the new chad! We wish great memes and a many based to come your way.';
        return intro + newChad + grass + profileLink + strings.footer;
    }

    return intro + grass + profileLink + strings.footer;   //Default case
}

//String for switch from flair to unflaired
function getUnflaired(author: string, flairOld: string, dateStr: string) {
    const unflairedChangeIntro = `Did you just change your flair, u/${author}? Last time I checked you were ${flairArticled(flairOld)} on ${dateStr}. How come now you are **unflaired**? Not only you are a dirty flair changer, you also willingly chose to join those subhumans.`;
    const profileLink = `\n\n[BasedCount Profile](https://basedcount.com/u/${author}) - `;  //Can't include in footer because it's dynamic

    return unflairedChangeIntro + strings.unflairedChangeOutro + profileLink + strings.footer;
}

//Returns a list of flair changes for the matching 'username'
function getListFlairs(username: string, log: WithId<User>, delay: number) {
    const listFooter = ` ^(Each user can use this command once every ${delay} minutes.)`;   //Use this if DELAY > 1
    // const listFooter = ` ^(Each user can use this command once every minute.)`;     //Use this if DELAY = 1
    const profileLink = `\n\n[BasedCount Profile](https://basedcount.com/u/${username}) - `;  //Can't include in footer because it's dynamic

    //Easter eggs
    if (username === 'flairchange_bot') {
        return strings.flairsFCBot + '\n\n' + profileLink + strings.footer + listFooter;
    } else if (username === 'basedcount_bot') {
        return strings.flairsBCBot + '\n\n' + profileLink + strings.footer + listFooter;
    } else if (username === '--UNFLAIRED--') {
        return strings.flairsUNFLAIRED + '\n\n' + profileLink + strings.footer + listFooter;
    }

    let msg = `User u/${username}`;
    let cringiness;

    //Cringe level, depending on amounts of flair changes
    if (log.flairs.length > 200) cringiness = 'infinitely';
    else if (log.flairs.length > 100) cringiness = 'abysmally';
    else if (log.flairs.length > 50) cringiness = 'immeasurably';
    else if (log.flairs.length > 35) cringiness = 'unfathomably';
    else if (log.flairs.length > 25) cringiness = 'extraordinarily';
    else if (log.flairs.length > 15) cringiness = 'exceptionally';
    else if (log.flairs.length > 10) cringiness = 'astonishingly';
    else if (log.flairs.length > 7) cringiness = 'remarkably';
    else if (log.flairs.length > 5) cringiness = 'especially';
    else if (log.flairs.length > 2) cringiness = 'uncommonly';
    else if (log.flairs.length > 1) cringiness = 'pretty';

    if (log.flairs.length > 2) {
        msg += ` changed their flair ${log.flairs.length - 1} times. This makes them ${cringiness} cringe.`; //Plural
    } else if (log.flairs.length === 2) {
        msg += ` changed their flair ${log.flairs.length - 1} time. This makes them ${cringiness} cringe.`;  //Singular
    } else {
        msg += ' never changed their flair. This makes them rather based.';
    }
    msg += ' Here\'s their flair history. ';
    msg += `Check it out along with their pills on [basedcount.com](https://basedcount.com/u/${username})!\n\n`;

    //This is to ensure no comment is over 10k chars of length
    if (log.flairs.length <= c.MAX_BASE_LIST)   // FC <= 168 - Base + Entry base - WORST CASE: 9978 chars
        msg = listShort(msg, log.flairs);
    else if (c.MAX_BASE_LIST < log.flairs.length && log.flairs.length <= c.MAX_NO_FLUFF_LIST)// 168 < FC <= 240 - Base no fluff + Entry no fluff - WORST CASE: 10000 chars
        msg = listLong(msg, log.flairs);
    else if (log.flairs.length > c.MIN_SEPARATOR_LIST)  //FC > 240 - Base no fluff + Entry no fluff + Separator@240 - WORST CASE: 10000 chars
        msg = listVeryLong(msg, log.flairs);


    //Full entries
    function listShort(msg: string, flairs: Flair[]) {
        flairs.forEach((elem, i) => {
            if (i == 0) {
                msg += `1. Started as ${elem.flair} on ${parseDate(elem.dateAdded)}\n\n`;
            } else {
                if(elem.event){
                    msg += eventListElement(elem);
                } else if (elem.flair == 'null') {
                    msg += `1. Went UNFLAIRED on ${parseDate(elem.dateAdded)}\n\n`;
                } else {
                    msg += `1. Switched to ${elem.flair} on ${parseDate(elem.dateAdded)}\n\n`;
                }
            }
        })

        return msg;
    }

    //No fluff in flair list entries
    function listLong(msg: string, flairs: Flair[]) {
        flairs.forEach((elem, i) => {
            if (i == 0) {
                msg += `1. ${elem.flair} on ${parseDate(elem.dateAdded)}\n\n`
            } else {
                if(elem.event){
                    msg += eventListElement(elem);
                } else if (elem.flair == 'null') {
                    msg += `1. UNFLAIRED on ${parseDate(elem.dateAdded)}\n\n`
                } else {
                    msg += `1. ${elem.flair} on ${parseDate(elem.dateAdded)}\n\n`
                }
            }
        })

        return msg;
    }

    //No fluff + separator in list entries
    function listVeryLong(msg: string, flairs: Flair[]) {
        for (const [i, elem] of flairs.entries()) {
            if (i >= c.MIN_SEPARATOR_LIST) break;    //stop at 240 (where separator will be added) - this is better than forEach, less iterations

            if (i == 0) {
                msg += `1. ${elem.flair} on ${parseDate(elem.dateAdded)}\n\n`
            } else {
                if(elem.event){
                    msg += eventListElement(elem);
                } else if (elem.flair == 'null') {
                    msg += `1. UNFLAIRED on ${parseDate(elem.dateAdded)}\n\n`
                } else {
                    msg += `1. ${elem.flair} on ${parseDate(elem.dateAdded)}\n\n`
                }
            }
        }

        msg += `*Due to technical limitations imposed by Reddit, this user's flair count is too long to be displayed correctly.*\n\n`   //Separator

        // eslint-disable-next-line no-useless-escape
        msg += `${flairs.length}\. ${flairs.at(-1)?.flair} on ${parseDate(flairs.at(-1)?.dateAdded as Date)}\n\n`   //Last entry

        return msg;
    }

    //Handle event related flair changes - currently the only event to have ever happened is April Fools 2023
    //WORST CASE: one char longer than worst listVeryLong
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function eventListElement(flair: Flair){
        return '1. Lost their flair on April Fools\' 2023\n\n';
    }

    return msg + '\n\n' + strings.footer + listFooter
}

//Handles different kinds of errors when summoning
function getListFlairsErr(context: number, delay: number) {
    const footer = `^(I am a bot, my mission is to spot cringe flair changers. You can check a user's history with the) **^( !flairs u/<name>)** ^(command. Each user can use this command once every ${delay} minutes.)`
    let msg

    if (context == 0) {
        msg = "That doesn't look correct. Enter a proper reddit username.\n\n"
    } else if (context == 1) {
        msg = "Sorry, that username doesn't appear in my database, I can't provide any flair history.\n\n"
    }
    return msg + '\n\n' + footer
}

//Returns a flair preceded by the appropriate indefinite article [a, an]. Special cases for 'Right' (centre) and 'Left' (centre)
function flairArticled(src: string) {
    const left = /left(?<!authleft|libleft)/gmi //Matches 'left' but not 'libleft' nor 'authleft'
    const right = /right(?<!authright|libright)/gmi //Same for 'right'

    if (src.match(left) || src.match(right)) src += 'ist' //Leftist / Rightist

    if (isVowel(src.charAt(0).toLowerCase())) return `an **${src}**`
    else return `a **${src}**`


    function isVowel(l: string) {
        if (l == 'a' || l == 'e' || l == 'i' || l == 'o' || l == 'u') return true
        else return false
    }
}

//Returns a date in the YYYY-MM-DD hh-mm format
function parseDate(d: Date) {
    const dateStr = d.toISOString();
    const dateStrMinified = dateStr.substring(0, dateStr.indexOf('T'));
    const hourMinutes = d.toTimeString().substr(0, 5);

    return `${dateStrMinified} ${hourMinutes}`;
}

//A simple getter
function getFooterUnflaired(username: string | null) {
    if (username === null) {
        return '\n\n[BasedCount](https://basedcount.com) - ' + strings.footerUnflaired;

    } else {
        return `\n\n[BasedCount Profile](https://basedcount.com/u/${username}) - ` + strings.footerUnflaired;
    }
}

export {
    getFlair,
    getGrass,
    getUnflaired,
    getListFlairs,
    getListFlairsErr,
    getFooterUnflaired
}