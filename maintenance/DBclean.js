require('dotenv').config();

const MongoClient = require('mongodb').MongoClient;
const uri = process.env.MONGODB_URI
const client = new MongoClient(uri);

let prev = 0
let counter = 0

const delay = 10 //delay [minutes] between multiple messages to the same user - prevents spam
let delayMS = delay * 60000; //same value as above but in milliseconds, needed for JS Date functions

(async() => {
    await client.connect()
    const db = client.db('flairChangeBot');

    cursor = db.collection('test').find()
    await cursor.forEach(user => {
        prev = 0
        counter = 0

        user.dateAdded.forEach((elem, i) => {
            if (elem - prev < delayMS) {
                console.log(i, prev, elem, elem - prev, (elem - prev) / 1000, user.flair[i])
                counter++
            } else {
                prev = elem
            }
        })



        if (counter != 0)
            console.log(user.name, 'removed', counter, 'flairs')

    })

})()