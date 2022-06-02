require('dotenv').config();

const MongoClient = require('mongodb').MongoClient;
const uri = process.env.MONGODB_URI
const client = new MongoClient(uri);

const basedUri = process.env.BASED_URI
const based = new MongoClient(basedUri)

const aggrPipe = [{
    $set: {
        size: { '$size': '$flair' }
    }
}, { $project: { _id: 0, name: 1, size: 1, flair: { $slice: ["$flair", -1] } } }, {
    $unwind: {
        path: '$flair'
    }
}, {
    $match: {
        $or: [{
            flair: 'Centrist'
        }, {
            flair: 'LibRight'
        }]
    }
}];

(async() => {
    await based.connect()
    await client.connect()

    const db = client.db('flairChangeBot')
    const dbBased = based.db('dataBased')

    cursor = db.collection('PCM_users').aggregate(aggrPipe)
    arr = await cursor.toArray()
        // console.log(arr)
    i = 0

    await arr.forEach(async elem => {
        if (elem.size > 1) return
        Bres = await dbBased.collection('users').findOne({ name: elem.name })
        if (Bres == null) return
        if (Bres.flair == 'Grey Centrist' || Bres.flair == 'Purple LibRight') {
            i++
            let len = elem.size - 1

            if (Bres.flair == 'Grey Centrist' && elem.flair == 'Centrist') {
                // await db.collection('PCM_users').updateOne({ id: elem.id }, { $push: { flair: 'GreyCentrist', dateAdded: new Date() } })
                console.log('Grey', elem.name, len, i)
            } else if (Bres.flair == 'Purple LibRight' && elem.flair == 'LibRight') {
                // await db.collection('PCM_users').updateOne({ id: elem.id }, { $push: { flair: 'PurpleLibRight', dateAdded: new Date() } })
                console.log('Purple', elem.name, len, i)
            }

        }
    });
    // await arr.forEach(async Belem => {
    //     Fres = await db.collection('PCM_users').findOne({ name: Belem.name })

    //     if (Fres == null && Belem.flair != 'Unflaired') {
    //         await db.collection('PCM_users').insertOne({ //Add them
    //             id: null,
    //             name: Belem.name,
    //             flair: [Belem.flair],
    //             dateAdded: [Belem._id.getTimestamp()]
    //         })
    //         console.log(Belem.name, Belem._id.getTimestamp(), Belem.flair)
    //     } else console.log('Rejected:', Belem.name)
    // })
    console.log('Job\'s done')
})()