function leaderboardPos(userId) { //MongoDB aggregation pipeline, gets leaderboard position (if any)
    const aggr = [{
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
    }, {
        $match: { id: userId } //Customizes the aggregation pipeline, filtering for this single user (passed as param)
    }]

    return aggr
}

module.exports = leaderboardPos