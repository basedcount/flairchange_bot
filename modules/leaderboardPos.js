const aggr = [{ //MongoDB aggregation pipeline, gets leaderboard position (if any)
    $project: {
        _id: 0,
        optOut: 0
    }
}, {
    $set: { size: { $size: '$flair' } }
}, {
    $match: {
        size: { $gt: 3 },
        flair: { $nin: ['None'] }
    }
}, {
    $setWindowFields: {
        sortBy: { size: -1 },
        output: { position: { $rank: {} } }
    }
}]

module.exports = aggr