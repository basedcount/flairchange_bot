const strings = {
    outro: `\n\n*"You have the right to change your mind, as I have the right to shame you for doing so." - Anonymous*`,
    footer: `\n\n^(I am a bot, my mission is to spot cringe flair changers. If you want to check another user's flair history write) **^(!flairs u/<name>)** ^(in a comment.)`,
    unflairedChangeOutro: `\n\nYou are beyond cringe, you are disgusting and deserving of all the downvotes you are going to get. Repent now and pick a new flair before it's too late.`,
    optOut: `You are both cringe and a coward. But fine, let's have it your way. I'll stop calling you out.`,
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

function getFlairListFooter(delay) {
    let footer = `^(I am a bot, my mission is to spot cringe flair changers. You can check a user's history with the) **^( !flairs u/<name>)** ^(command. Each user can use this command once every ${delay} minutes.)`
    return footer
}

module.exports = {
    getFlair,
    getGrass,
    getUnflaired,
    getOptOut,
    getFlairListFooter
}