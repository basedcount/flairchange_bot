const aggr = [{
        $project: {
            _id: 0,
            id: 0,
            optOut: 0,
            dateAdded: 0
        }
    }, {
        $set: { size: { $size: '$flair' } }
    },
    {
        $match: {
            size: { $gt: 3 }, //Pruning, doesn't consider non-flair changers, unfrequent changers or unflaired
            flair: { $nin: ['None'] }
        }
    }, {
        $setWindowFields: {
            sortBy: { size: -1 },
            output: { position: { $rank: {} } }
        }
    }
]

module.exports = aggr