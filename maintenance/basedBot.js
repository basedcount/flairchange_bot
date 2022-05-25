require('dotenv').config();

const MongoClient = require('mongodb').MongoClient;
const uri = process.env.MONGODB_URI
const client = new MongoClient(uri);

const basedUri = process.env.BASED_URI
const based = new MongoClient(basedUri);

(async() => {
    await based.connect()
    await client.connect()

    const db = client.db('flairChangeBot')
    const dbBased = based.db('dataBased')

    Bcursor = dbBased.collection('users').find()
    arr = await Bcursor.toArray()
        // console.log(arr)
    await arr.forEach(async Belem => {
        Fres = await db.collection('PCM_users').findOne({ name: Belem.name })

        if (Fres == null && Belem.flair != 'Unflaired') {
            await db.collection('PCM_users').insertOne({ //Add them
                id: null,
                name: Belem.name,
                flair: [Belem.flair],
                dateAdded: [Belem._id.getTimestamp()]
            })
            console.log(Belem.name, Belem._id.getTimestamp(), Belem.flair)
        } else console.log('Rejected:', Belem.name)
    })
    console.log('Job\'s done')
})()