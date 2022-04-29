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
                    flair: [flair],
                    dateAdded: [new Date()]
                })
            } else if (res.flair.at(-1) != flair) { //User already present in DB and has update their flair!
                console.log('Flair change!', comment.author_fullname, comment.author.name, 'was', res.flair.at(-1), 'now is', flair)

                let date = new Date(res.dateAdded.at(-1))
                let dateStr = date.getUTCFullYear().toString() + '-' + (date.getUTCMonth() + 1).toString() + '-' + date.getUTCDate().toString()
                let msg = `Did you just change your flair, u/${comment.author.name}? Last time I checked you were **${res.flair.at(-1)}** on ${dateStr}. How come now you are **${flair}**?  \nHave you perhaps shifted your ideals? Because that's cringe, you know?\n\n*"You have the right to change your mind, as I have the right to shame you for doing so." - Anonymus*\n\n^(Bip) ^(bop,) ^(I) ^(am) ^(a) ^(bot.) ^(Don't) ^(get) ^(too) ^(mad.)`

                // comment.reply(msg) //Let's just avoid this. Add on release

                await db.collection('PCM_users').updateOne({ id: comment.author_fullname }, { $push: { flair: flair, dateAdded: new Date() } }, (err, res) => {
                    if (err) throw err
                })
            }
        })
    })()
})

client.close()