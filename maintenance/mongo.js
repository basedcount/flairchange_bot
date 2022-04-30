require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const uri = process.env.MONGODB_URI
const client = new MongoClient(uri);
const db = client.db('flairChangeBot');

(async() => {
    await client.connect()
    db.collection('PCM_users').findOne({ id: 't2_95mg73h5' }, async(err, res) => {
        if (err) throw err

        console.log(res.name)
        if (res.optOut) console.log(res.optOut)
        console.log('works')
    })
})()