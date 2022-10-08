const strings = {
    // outro: `\n\n*"You have the right to change your mind, as I have the right to shame you for doing so." - Anonymous*`, //unused
    footer: `\n\n^(I am a bot, my mission is to spot cringe flair changers. If you want to check another user's flair history write) **^(!flairs u/<name>)** ^(in a comment. Have a look at my [FAQ](https://www.reddit.com/user/flairchange_bot/comments/uf7kuy/bip_bop) and the [leaderboard](https://www.reddit.com/user/flairchange_bot/comments/uuhlu2/leaderboard).)`,
    unflairedChangeOutro: `\n\nYou are beyond cringe, you are disgusting and deserving of all the downvotes you are going to get. Repent now and pick a new flair before it's too late.`,
    optOut: `You are both cringe and a coward, however [I no longer offer opt outs](https://www.reddit.com/user/flairchange_bot/comments/v8f90t/about_the_opt_out_feature/?utm_source=share&utm_medium=web2x&context=3).  \nI'll keep bothering you as much as I do with any other user. Sorry, not sorry.`,
    flairsFCBot: `Nothing to see here. Always been AuthCenter, always will. I'm no flair changer.`,
    flairsBCBot: `You leave my good friend u/basedcount_bot out of this! He's a good guy, not some dirty flair changer.`,
    flairsUNFLAIRED: `u/--UNFLAIRED-- is, was and probably will always be: unflaired; he is the cringiest unflaired of them all. His memes are fucking good tho, that makes him both based and cringe at the same time.`
}

const ins = {
    AuthRight: "\n\nRemember, the jannies are always watching. No gamer words, no statistics and by all means no wood cutting machines. Tell us, how are you going to flair the new account you'll make in two weeks?",
    Right: "\n\nNo, me targeting you is not part of a conspiracy. And no, your flair count is not rigged. Stop listening to QAnon or the Orange Man and come out of that basement.",
    LibRight: "\n\nAre you mad? Pointing a military grade gun at your monitor won't solve much, pal. Come on, put that rifle down and go take a shower.",
    PurpleLibRight: "\n\nNow come on, put your pants back on and go outside, you dirty degen.  \nNo wait, not that way. There's a school over there!",
    LibCenter: "\n\nWait, those were too many words, I'm sure. Maybe you'll understand this, monke: \"oo oo aah YOU CRINGE ahah ehe\".",
    LibLeft: "\n\nYeah yeah, I know. In your ideal leftist commune everyone loves each other and no one insults anybody. Guess what? Welcome to the real world. What are you gonna do? Cancel me on twitter?",
    Left: "\n\n If Orange was a flair you probably would have picked that, am I right? You watermelon-looking snowflake.",
    AuthLeft: "\n\nWhat? You are hungry? You want food? I fear you've chosen the wrong flair, comrade.",
    AuthCenter: "\n\nThat being said... Based and fellow Auth pilled, welcome home.",
    Centrist: "\n\nTell us, are you scared of politics in general or are you just too much of a coward to let everyone know what you think?",
    GreyCentrist: "\n\nActually nevermind, you are good. Not having opinions is still more based than having dumb ones. Happy grilling, brother."
}

//String for regular flair changes
function getFlair(author, flairOld, dateStr, flairNew) {
    if (author.includes('_')) author = escape(author, '_')
    let intro = `Did you just change your flair, u/${author}? Last time I checked you were ${flairArticled(flairOld)} on ${dateStr}. How come now you are ${flairArticled(flairNew)}? Have you perhaps shifted your ideals? Because that's cringe, you know?`
    return intro + ins[flairNew] + strings.footer
}

//String for leaderboard (needs to touch grass)
function getGrass(author, flairOld, dateStr, flairNew, size, pos) {
    if (author.includes('_')) author = escape(author, '_')
    let intro = `Did you just change your flair, u/${author}? Last time I checked you were ${flairArticled(flairOld)} on ${dateStr}. How come now you are ${flairArticled(flairNew)}? Have you perhaps shifted your ideals? Because that's cringe, you know?`
    let grass = `\n\nOh and by the way. You have already changed your flair ${size} times, making you the ${pos} largest flair changer in this sub.\nGo touch some fucking grass.`
    return intro + grass + strings.footer
}

//String for switch from flair to unflaired
function getUnflaired(author, flairOld, dateStr) {
    if (author.includes('_')) author = escape(author, '_')
    let unflairedChangeIntro = `Did you just change your flair, u/${author}? Last time I checked you were ${flairArticled(flairOld)} on ${dateStr}. How come now you are **unflaired**? Not only you are a dirty flair changer, you also willingly chose to join those subhumans.`
    return unflairedChangeIntro + strings.unflairedChangeOutro + strings.footer
}

//String for optOut
function getOptOut() {
    return strings.optOut
}

//Returns a list of flair changes for the matching 'username'
function getListFlairs(username, log, delay, pills) {
    // let listFooter = ` ^(Each user can use this command once every ${delay} minutes.)`   //Use this if DELAY > 1
    let listFooter = ` ^(Each user can use this command once every minute.)`

    //Easter eggs
    if (username === 'flairchange_bot') {
        return strings.flairsFCBot + '\n\n' + strings.footer + listFooter
    } else if (username === 'basedcount_bot') {
        return strings.flairsBCBot + '\n\n' + strings.footer + listFooter
    } else if (username === '--UNFLAIRED--' && log.unflaired) {
        return strings.flairsUNFLAIRED + '\n\n' + strings.footer + listFooter
    }

    if (username.includes('_')) username = escape(username, '_')

    let msg = `User u/${username}`
    let cringiness

    //Cringe level, depending on amounts of flair changes
    if (log.flairs.length > 200) cringiness = 'infinitely'
    else if (log.flairs.length > 100) cringiness = 'abysmally'
    else if (log.flairs.length > 50) cringiness = 'immeasurably'
    else if (log.flairs.length > 35) cringiness = 'unfathomably'
    else if (log.flairs.length > 25) cringiness = 'extraordinarily'
    else if (log.flairs.length > 15) cringiness = 'exceptionally'
    else if (log.flairs.length > 10) cringiness = 'astonishingly'
    else if (log.flairs.length > 7) cringiness = 'remarkably'
    else if (log.flairs.length > 5) cringiness = 'especially'
    else if (log.flairs.length > 2) cringiness = 'uncommonly'
    else if (log.flairs.length > 1) cringiness = 'pretty'

    if (log.flairs.length > 2) {
        msg += ` changed their flair ${log.flairs.length - 1} times. This makes them ${cringiness} cringe.` //Plural
    } else if (log.flairs.length === 2) {
        msg += ` changed their flair ${log.flairs.length - 1} time. This makes them ${cringiness} cringe.`  //Singular
    } else {
        msg += ' never changed their flair. This makes them rather based.'
    }
    msg += ' Here\'s their flair history:\n\n'

    log.flairs.forEach((elem, i) => {
        if (i == 0) {
            msg += `${i + 1}) Started as ${elem.flair} on ${parseDate(elem.dateAdded)}.\n\n`
        } else {
            if (elem.flair == 'null') {
                msg += `${i + 1}) Went UNFLAIRED on ${parseDate(elem.dateAdded)}.\n\n`

            } else {
                msg += `${i + 1}) Switched to ${elem.flair} on ${parseDate(elem.dateAdded)}.\n\n`

            }
        }
    })

    //Getting rid of these. In due time they'll be replaced by a link to the website's REDESIGN
    // if (pills === 1) msg += `They have ${pills} pill, check it out on [basedcount.com](https://basedcount.com/u/${username}).\n\n`
    // else if (pills > 1) msg += `They have ${pills} pills, check them out on [basedcount.com](https://basedcount.com/u/${username}).\n\n`

    return msg + strings.footer + listFooter
}

//Handles different kinds of errors when summoning
function getListFlairsErr(context, delay) {
    let footer = `^(I am a bot, my mission is to spot cringe flair changers. You can check a user's history with the) **^( !flairs u/<name>)** ^(command. Each user can use this command once every ${delay} minutes.)`
    let msg

    if (context == 0) {
        msg = "That doesn't look correct. Enter a proper reddit username.\n\n"
    } else if (context == 1) {
        msg = "Sorry, that username doesn't appear in my database, I can't provide any flair history.\n\n"
    }
    return msg + footer
}

//Returns a flair preceded by the appropriate indefinite article [a, an]. Special cases for 'Right' (centre) and 'Left' (centre)
function flairArticled(src) {
    let left = /left(?<!authleft|libleft)/gmi //Matches 'left' but not 'libleft' nor 'authleft'
    let right = /right(?<!authright|libright)/gmi //Same for 'right'

    if (src.match(left) || src.match(right)) src += 'ist' //Leftist / Rightist

    if (isVowel(src.charAt(0).toLowerCase())) return `an **${src}**`
    else return `a **${src}**`


    function isVowel(l) {
        if (l == 'a' || l == 'e' || l == 'i' || l == 'o' || l == 'u') return true
        else return false
    }
}

//Escapes all occurrences of 'toEscape' in 'str'
function escape(str, toEscape) {
    let res = ''
    for (let i = 0; i < str.length; i++) {
        if (str[i] === toEscape) res += `\\${str[i]}`
        else res += str[i]
    }
    return res
}

//Returns a date in the YYYY-MM-DD hh-mm format
function parseDate(d){
    const dateStr = d.toISOString();
    const dateStrMinified = dateStr.substring(0, dateStr.indexOf('T'));

    const hour = d.getHours();
    const minute = d.getMinutes();

    return `${dateStrMinified} ${hour}:${minute} UTC`;
}

export {
    getFlair,
    getGrass,
    getUnflaired,
    getOptOut,
    getListFlairs,
    getListFlairsErr
}