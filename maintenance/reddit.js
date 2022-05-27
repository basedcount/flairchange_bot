const port = process.env.PORT

require('dotenv').config();
const Snoowrap = require('snoowrap');
const Snoostorm = require('snoostorm');

const MongoClient = require('mongodb').MongoClient;
const uri = process.env.MONGODB_URI
const client = new MongoClient(uri);

const r = new Snoowrap({
    userAgent: 'flairchange_bot v1.0.0; A bot detecting user flair changes, by u/Nerd02',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS
});

let count = 0;

(async() => {
    await client.connect()
    const db = client.db('flairChangeBot');

    let curs = db.collection('PCM_users').find({ id: null })

    let i = 1

    curs.forEach(el => {
        setTimeout(() => {
            r.getUser(el.name).fetch()
                .catch({ statusCode: 404 }, err => {}).then(u => {
                    if (u != undefined) {
                        if (u.id != undefined) {
                            let l = u.id
                            let id = `t2_${l}`

                            updateLog(db, el.name, id)
                        } else {
                            deleteLog(db, el.name)
                        }
                    } else {
                        deleteLog(db, el.name)
                    }
                })
        }, 1000 * i)
        i++
    })
})()

async function deleteLog(db, name) {
    await db.collection('PCM_users').deleteOne({ name: name })
    console.log('Deleted', name, count)
    count++
}

async function updateLog(db, name, id) {
    await db.collection('PCM_users').updateOne({ name: name }, { $set: { id: id } })
    console.log('Update', name, id)
}