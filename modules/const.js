const c = {
    SUMMON_DELAY: 2, //[minutes] - cooldown for summon with !flairs
    FLAIR_CHANGE_DELAY: 5, //[minutes] - cooldown for flair change
    NEIGHBOUR_DICE: 4, //25% - roll for answer to small shifts (neighbouring quadrants)
    UNFLAIRED_DICE: 10, //10% - roll for answer to unflaired (insult)
    OPTOUT_DICE: 5, //20% - roll for answer to optout (for users who have already opted out)
}

module.exports = c