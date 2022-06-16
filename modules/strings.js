const strings = {
    outro: `\n\n*"You have the right to change your mind, as I have the right to shame you for doing so." - Anonymous*`,
    footer: `\n\n^(I am a bot, my mission is to spot cringe flair changers. If you want to check another user's flair history write) **^(!flairs u/<name>)** ^(in a comment. Have a look at my [FAQ](https://www.reddit.com/user/flairchange_bot/comments/uf7kuy/bip_bop) and the [leaderboard](https://www.reddit.com/user/flairchange_bot/comments/uuhlu2/leaderboard).)`,
    unflairedChangeOutro: `\n\nYou are beyond cringe, you are disgusting and deserving of all the downvotes you are going to get. Repent now and pick a new flair before it's too late.`,
    optOut: `You are both cringe and a coward, however [I no longer offer opt outs](https://www.reddit.com/user/flairchange_bot/comments/v8f90t/about_the_opt_out_feature/?utm_source=share&utm_medium=web2x&context=3).  \nI'll keep bothering you as much as I do with any other user. Sorry, not sorry.`,
    flairsFCBot: `Nothing to see here. Always been AuthCenter, always will. I'm no flair changer.`,
    flairsBCBot: `You leave my good friend u/basedcount_bot out of this! He's a good guy, not some dirty flair changer.`,
    flairsUNFLAIRED: `u/--UNFLAIRED-- is, was and probably will always be: unflaired; he is the cringiest unflaired of them all. His memes are fucking good tho, that makes him both based and cringe at the same time.`
}

const ins = {
    AuthRight: "\n\nYeah, yeah we know: 13%, (((them))), [redacted]... Tell us, how are you going to flair the new account you'll make in two weeks?",
    Right: "\n\nNo, me targeting you is not part of a conspiracy. And no, your flair count is not rigged. Stop listening to QAnon or the Orange Man and come out of that basement.",
    LibRight: "\n\nAre you mad? Pointing a military grade gun at your monitor won't solve much, pal. Come on, put that rifle down and go take a shower.",
    PurpleLibRight: "\n\nNow come on, put your pants back on and go outside, you dirty degen.  \nNo wait, not that way. There's a school over there!",
    LibCenter: "\n\nWait, those were too many words, I'm sure. Maybe you'll understand this, monkey: \"oo oo aah YOU CRINGE ahah ehe\".",
    LibLeft: "\n\nYeah yeah, I know. In your ideal leftist communne everyone loves each other and no one insults anybody. Guess what? Welcome to the real word. What are you gonna do? Cancel me on twitter?",
    Left: "\n\n If Orange was a flair you probably would have picked that, am I right? You watermelon-looking snowflake.",
    AuthLeft: "\n\nWhat? You are hungry? You want food? I fear you've chosen the wrong flair, comrade.",
    AuthCenter: "\n\nThat being said... Based and fellow Auth pilled, welcome home.",
    Centrist: "\n\nTell us, are you scared of politics in general or are you just too much of a coward to let everyone know what you think?",
    GreyCentrist: "\n\nActually nevermind, you are good. Not having opinions is still more based than having dumb ones. Happy grilling, brother."
}

//String for regular flair changes
function getFlair(author, flairOld, dateStr, flairNew) {
    let intro = `Did you just change your flair, u/${author}? Last time I checked you were **${flairOld}** on ${dateStr}. How come now you are **${flairNew}**? Have you perhaps shifted your ideals? Because that's cringe, you know?`
    return intro + ins[flairNew] + strings.footer
}

//String for leaderboard (needs to touch grass)
function getGrass(author, flairOld, dateStr, flairNew, size, pos) {
    let intro = `Did you just change your flair, u/${author}? Last time I checked you were **${flairOld}** on ${dateStr}. How come now you are **${flairNew}**? Have you perhaps shifted your ideals? Because that's cringe, you know?`
    let grass = `\n\nOh and by the way. You have already changed your flair ${size} times, making you the ${pos} largest flair changer in this sub.\nGo touch some fucking grass.`
    return intro + grass + strings.footer
}

//String for switch from flair to unflaired
function getUnflaired(author, flairOld, dateStr) {
    let unflairedChangeIntro = `Did you just change your flair, u/${author}? Last time I checked you were **${flairOld}** on ${dateStr}. How come now you are **unflaired**? Not only you are a dirty flair changer, you also willingly chose to join those subhumans.`
    return unflairedChangeIntro + strings.unflairedChangeOutro + strings.footer
}

//String for optOut
function getOptOut() {
    return strings.optOut
}

//Returns a list of flair changes for the matching 'username'
function getListFlairs(username, log, delay) {
    let warning = `^(Be aware that some data may be missing, the oldest data I have dates back to 2022-04-25.)\n\n`
    let listFooter = ` ^(Each user can use this command once every ${delay} minutes.)`

    //Easter eggs
    if (username === 'flairchange_bot') {
        return strings.flairsFCBot + '\n\n' + strings.footer + listFooter
    } else if (username === 'basedcount_bot') {
        return strings.flairsBCBot + '\n\n' + strings.footer + listFooter
    } else if (username === '--UNFLAIRED--' && log.unflaired) {
        return strings.flairsUNFLAIRED + '\n\n' + strings.footer + listFooter
    }

    let msg = `User u/${username}`
    let cringiness

    //Cringe level, depending on amounts of flair changes
    if (log.flair.length >= 50) cringiness = 'infinitely'
    else if (log.flair.length >= 40) cringiness = 'abismally'
    else if (log.flair.length >= 30) cringiness = 'immeasurably'
    else if (log.flair.length >= 20) cringiness = 'unfathomably'
    else if (log.flair.length >= 15) cringiness = 'extraordinarily'
    else if (log.flair.length >= 10) cringiness = 'exceptionally'
    else if (log.flair.length >= 7) cringiness = 'astonishingly'
    else if (log.flair.length >= 5) cringiness = 'remarkably'
    else if (log.flair.length >= 3) cringiness = 'especially'
    else if (log.flair.length >= 2) cringiness = 'uncommonly'
    else if (log.flair.length >= 1) cringiness = 'pretty'

    if (log.flairs.length > 1) {
        msg += ` changed their flair ${log.flairs.length} times. This makes them ${cringiness} cringe.`
    } else {
        msg += ' never changed their flair. This makes them rather based.'
    }
    msg += ' Here\'s their flair history:\n\n'

    log.flairs.forEach((elem, i) => {
        if (i == 0) {
            if (elem.dateAdded < new Date('2022-04-25')) { //Old log (taken from basedcount_bot)
                msg += `${i + 1}) Started as ${elem.flair} some time before ${new Date('2022-04-25').toUTCString()}.\n\n`
            } else {
                msg += `${i + 1}) Started as ${elem.flair} on ${elem.dateAdded.toUTCString()}.\n\n`
            }
        } else {
            if (elem.flair == 'null') {
                msg += `${i + 1}) Went UNFLAIRED on ${elem.dateAdded.toUTCString()}.\n\n`

            } else {
                msg += `${i + 1}) Switched to ${elem.flair} on ${elem.dateAdded.toUTCString()}.\n\n`

            }
        }
    })

    return msg + warning + strings.footer + listFooter
}

function getListFlairsErr(context, delay) {
    let footer = `^(I am a bot, my mission is to spot cringe flair changers. You can check a user's history with the) **^( !flairs u/<name>)** ^(command. Each user can use this command once every ${delay} minutes.)`
    let msg

    if (context == 0) {
        msg = "That doesn't look correct. Enter a proper reddit username.\n\n"
    } else if (context == 1) {
        msg = "Sorry, that username doesn't appear in my database, I can't provide any flair history.  \nRemember that reddit usernames are CaSe SeNsItIvE\n\n"
    }
    return msg + footer
}

module.exports = {
    getFlair,
    getGrass,
    getUnflaired,
    getOptOut,
    getListFlairs,
    getListFlairsErr
}