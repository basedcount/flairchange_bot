const { CommentStream } = require('snoostorm');

require('dotenv').config();
const Snoowrap = require('snoowrap');
const Snoostorm = require('snoostorm');

const uri = process.env.MONGODB_URI
const r = new Snoowrap({
    userAgent: 'some-description',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS
});

const stream = new CommentStream(r, {
    subreddit: 'PoliticalCompassMemes',
    results: 1
});

stream.on('item', comment => {
    let flair = comment.author_flair_text
    if (flair != null) flair = flair.substring(flair.indexOf('-') + 2)
    console.log(comment.author_fullname, comment.author.name, flair)
})