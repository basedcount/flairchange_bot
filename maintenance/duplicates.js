require('dotenv').config()

const MongoClient = require('mongodb').MongoClient
const uri = process.env.MONGODB_URI
const client = new MongoClient(uri)

const aggrPipe = [
    // { $match: { "flair": { "$size": 1 } } },
    { "$group": { "_id": "$id", "count": { "$sum": 1 } } },
    { "$match": { "_id": { "$ne": null }, "count": { "$gt": 1 } } },
    { "$project": { "id": "$_id", "_id": 0 } }
];

(async() => {
    await client.connect()
    const db = client.db('flairChangeBot')
    cursor = db.collection('PCM_users').aggregate(aggrPipe)

    cursor.forEach(async el => {
        console.log(el.id)
    })
})()