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
});

client.connect()
const db = client.db('flairChangeBot');

stream.on('item', comment => {
    let flair = comment.author_flair_text
    if (flair != null)
        flair = flair.substring(flair.indexOf('-') + 2)
    else {
        // console.log('Unflaired:', comment.author_fullname, comment.author.name, flair) //User is unflaired, no need to lose my time here
        return
    }

    (async() => {

        let returned = await db.collection('PCM_users').findOne({ id: comment.author_fullname }, async(err, res) => {
            if (err) throw err
            if (res === null) { //User not present in DB
                await db.collection('PCM_users').insertOne({
                        id: comment.author_fullname,
                        name: comment.author.name,
                        flair: flair,
                        dateAdded: new Date()
                    })
                    // console.log('Inserted:', comment.author_fullname, comment.author.name, flair)
            } else if (res.flair != flair) {
                console.log('Flair change!', comment.author_fullname, comment.author.name, 'was', flair, 'now is', res.flair)
                    //Update, todo
            } else { //User already present in DB
                // console.log('Touch some grass:', comment.author_fullname, comment.author.name, flair)
            }
        })
    })()
})

client.close()