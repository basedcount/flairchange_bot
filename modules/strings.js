const strings = {
    outro: `\n\n*"You have the right to change your mind, as I have the right to shame you for doing so." - Anonymous*`,
    footer: `\n\n^(I am a bot, my mission is to spot cringe flair changers. If you want to check another user's flair history write) **^(!flairs u/<name>)** ^(in a comment.)`,
    unflairedChangeOutro: `\n\nYou are beyond cringe, you are disgusting and deserving of all the downvotes you are going to get. Repent now and pick a new flair before it's too late.`,
    optOut: `You are both cringe and a coward. But fine, let's have it your way. I'll stop calling you out.`,
}

const ins = {
    AuthRight: "\n\nYeah, yeah we know: 13%, (((them))), [redacted]... Tell us, how are you going to flair the new account you'll make in two weeks?",
    Right: "generic_right_insult",
    LibRight: "\n\nAre you mad? Pointing a military grade gun at your monitor won't solve much, pal. Come on, put that rifle down and go take a shower.",
    PurpleLibRight: "\n\nNow come on, put your pants back on and go outside, you dirty degen.  \nNo, not that way, there's a school over there!",
    LibCenter: "\n\nWait, those were too many words, I'm sure. Maybe you'll understand this, monkey: \"oo oo aah YOU CRINGE ahah ehe\".",
    LibLeft: "\n\nDid I offend you/them/xir/whatever? What are you gonna do? Cancel me on twitter?",
    Left: "generic_left_insult",
    AuthLeft: "\n\nWhat? You are hungry? You want food? I fear you've chosen the wrong flair, comrade.",
    AuthCenter: "\n\nThat being said... Based and fellow Auth pilled, welcome home.",
    Centrist: "\n\nTell us, are you scared of politics in general or are you just too much of a coward to let everyone now what you think?",
    GreyCentrist: "\n\nActually nevermind, you are good. Not having opinions is still more based than having dumb ones. Happy grilling, brother."
}

//String for regular flair changes
function getFlair(author, flairOld, dateStr, flairNew) {
    let intro = `Did you just change your flair, u/${author}? Last time I checked you were **${flairOld}** on ${dateStr}. How come now you are **${flairNew}**?Have you perhaps shifted your ideals? Because that's cringe, you know?`
    return intro + strings.outro + strings.footer
}

//String for leaderboard (needs to touch grass)
function getGrass(author, flairOld, dateStr, flairNew, size, pos) {
    let intro = `Did you just change your flair, u/${author}? Last time I checked you were **${flairOld}** on ${dateStr}. How come now you are **${flairNew}**?Have you perhaps shifted your ideals? Because that's cringe, you know?`
    let grass = `\n\nOh and by the way. You have already changed your flair ${size} times, making you the ${pos} largest flair changer in this sub.\nGo touch some fucking grass.`
    return intro + grass + strings.outro + strings.footer
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

//String for footer, summon !flairs u/name
function getFlairListFooter(delay) {
    let footer = `^(I am a bot, my mission is to spot cringe flair changers. You can check a user's history with the) **^( !flairs u/<name>)** ^(command. Each user can use this command once every ${delay} minutes.)`
    return footer
}

//String for flair change, small shifts
function getSmallShift(author, flairOld, dateStr, flairNew) {
    let intro = `Did you just change your flair, u/${author}? Last time I checked you were **${flairOld}** on ${dateStr}. How come now you are **${flairNew}**?Have you perhaps shifted your ideals? Because that's cringe, you know?`

    return intro + ins[flairNew] + strings.footer
}

module.exports = {
    getFlair,
    getGrass,
    getUnflaired,
    getOptOut,
    getFlairListFooter,
    getSmallShift
}