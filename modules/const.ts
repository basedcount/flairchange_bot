const c = {
    SUMMON_DELAY: 1, //[minutes] - cooldown for summon with !flairs
    FLAIR_CHANGE_DELAY: 5, //[minutes] - cooldown for flair change
    NEIGHBOUR_PTG: 0, //roll for answer to small shifts (neighbouring quadrants)
    UNFLAIRED_PTG: 10, //roll for answer to unflaired (insult)
    // OPTOUT_PTG: 20, //roll for answer to optout (for users who have already opted out)
    DEBUG: false, //Debug mode - if active doesn't send any message nor post
    LEADERBOARD_CNG: 10, //Lowest position for leaderboard positioning (on flair change)
    MAX_BASE_LIST: 168, //!flairs - maximum number of regular entries
    MAX_NO_FLUFF_LIST: 240, //!flairs - maximum number of shortened entries
    MIN_SEPARATOR_LIST: 240 //!flairs - minimum number of shortened entries that also require a separator being added
}

export default c