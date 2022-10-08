const c = {
    SUMMON_DELAY: 1, //[minutes] - cooldown for summon with !flairs
    FLAIR_CHANGE_DELAY: 5, //[minutes] - cooldown for flair change
    NEIGHBOUR_PTG: 0, //roll for answer to small shifts (neighbouring quadrants)
    UNFLAIRED_PTG: 10, //roll for answer to unflaired (insult)
    OPTOUT_PTG: 20, //roll for answer to optout (for users who have already opted out)
    DEBUG: false, //Debug mode - if active doesn't send any message nor post
    LEADERBOARD_CNG: 10, //Lowest position for leaderboard positioning (on flair change)
    LEADERBOARD_POST: 50 //Number of leaderboard entries shown (on reddit post)
}

export default c