const port = process.env.PORT
const { CommentStream } = require('snoostorm');

require('dotenv').config();
const Snoowrap = require('snoowrap');
const Snoostorm = require('snoostorm');

const MongoClient = require('mongodb').MongoClient;
const uri = process.env.MONGODB_URI
const client = new MongoClient(uri);

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
        /*,
             pollTime: 5000*/ //Add this line if reddit api seems slow
});

client.connect()
const db = client.db('flairChangeBot');

stream.on('item', comment => {
    let flair = comment.author_flair_text

    if (flair != null) { //If user is NOT unflaired, parse the flair and save it correctly
        flair = flair.substring(flair.indexOf('-') + 2)
    } else { //User is unflaired, no need to lose my time here
        return
    }

    (async() => {
        await db.collection('PCM_users').findOne({ id: comment.author_fullname }, async(err, res) => { //Check for any already present occurrence
            if (err) throw err

            if (res === null) { //User not present in DB
                await db.collection('PCM_users').insertOne({ //Add them
                    id: comment.author_fullname,
                    name: comment.author.name,
                    flair: flair,
                    dateAdded: new Date()
                })
            } else if (res.flair != flair) { //User already present in DB and has update their flair!
                console.log('Flair change!', comment.author_fullname, comment.author.name, 'was', res.flair, 'now is', flair)
                await db.collection('PCM_users').updateOne({ id: comment.author_fullname }, { $set: { flair: flair } }, (err, res) => {
                    if (err) throw err

                    let msg = 'Flair change cringe' //TODO: write quirky and funny

                    if (comment.author_fullname === 't2_105aw2') { //Test line, remove on release (only answers DEV - prevents spam)
                        console.log('Answering:', comment.body)
                        comment.reply(msg)
                    }
                })
            }
        })
    })()
})

client.close()