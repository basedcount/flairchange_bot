require('dotenv').config();

const MongoClient = require('mongodb').MongoClient;
const uri = process.env.MONGODB_URI
const client = new MongoClient(uri);

let prev = 0
let counter = 0

const delay = 5 //delay [minutes] between multiple messages to the same user - prevents spam
let delayMS = delay * 60000; //same value as above but in milliseconds, needed for JS Date functions

(async() => {
    await client.connect()
    const db = client.db('flairChangeBot');

    cursor = db.collection('PCM_users').find()
    await cursor.forEach(user => {
        prev = 0
        counter = 0
        let flairs = Array()
        let dates = Array()

        user.dateAdded.forEach((elem, i) => {
            if (elem - prev < delayMS) {
                counter++
            } else {
                prev = elem
                dates.push(elem)
                flairs.push(user.flair[i])
            }
        })

        db.collection('PCM_users').updateOne({
            id: user.id
        }, {
            $set: {
                'flair': flairs,
                'dateAdded': dates
            }
        })

        if (counter != 0)
            console.log(user.name, 'removed', counter, 'flairs')

    })
    console.log('Done!')
})()