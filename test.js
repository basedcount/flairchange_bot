const port = process.env.PORT
const { CommentStream } = require('snoostorm');

require('dotenv').config();
const Snoowrap = require('snoowrap');
const Snoostorm = require('snoostorm');

const r = new Snoowrap({
    userAgent: 'some-description',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS
});

const stream = new CommentStream(r, {
    subreddit: 'testingground4bots',
    results: 1
        /*,
             pollTime: 5000*/ //Add this line if reddit api seems slow
});

stream.on('item', comment => {
        let user = 'Nerd02',
            oldFlair = 'QuickBrownFox',
            newFlair = 'LazyDog',
            date = new Date(),
            dateStr = date.getUTCFullYear().toString() + '-' + (date.getUTCMonth() + 1).toString() + '-' + date.getUTCDate().toString()

        let msg = `Did you just change your flair, u/${user}? Last time I checked you were **${oldFlair}** on ${dateStr}. How come now you are **${newFlair}**?  \nHave you perhaps shifted your ideals? Because that's cringe, you know?\n\n*"You have the right to change your mind, as I have the right to shame you for doing so." - Anonymus*\n\n^(Bip) ^(bop,) ^(I) ^(am) ^(a) ^(bot.) ^(Don't) ^(get) ^(too) ^(mad.)`
        if (comment.author_fullname === 't2_105aw2') { //Test line, remove on release (only answers DEV - prevents spam)
            comment.reply(msg)
            console.log(comment.body)
        }
    })
    // console.log(msg)
    //TODO: test msg.txt on test.js, then combine everything on index.js. Comment to avoid sending reply commands and let it age like fine wine (fuck AutoMod)