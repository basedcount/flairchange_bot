const port = process.env.PORT
const { CommentStream } = require('snoostorm');

require('dotenv').config();
const Snoowrap = require('snoowrap');
const Snoostorm = require('snoostorm');

const r = new Snoowrap({
    userAgent: 'flairchange_bot v1.0.0; A bot detecting user flair changes, by u/Nerd02',
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
        if (comment.author_fullname === 't2_105aw2') { //Test line, remove on release (only answers DEV - prevents spam)
            console.log(comment.body)
            if (comment.body === '!cringe') {
                console.log('User is cringe')
                comment.reply('You are cringe')
            }
            comment.reply('No cringe detected')
        }
    })
    // console.log(msg)
    //TODO: test msg.txt on test.js, then combine everything on index.js. Comment to avoid sending reply commands and let it age like fine wine (fuck AutoMod)