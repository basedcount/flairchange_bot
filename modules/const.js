const c = {
    SUMMON_DELAY: 2, //[minutes] - cooldown for summon with !flairs
    FLAIR_CHANGE_DELAY: 5, //[minutes] - cooldown for flair change
    NEIGHBOUR_PTG: 15, //roll for answer to small shifts (neighbouring quadrants)
    UNFLAIRED_PTG: 15, //roll for answer to unflaired (insult)
    OPTOUT_PTG: 20, //roll for answer to optout (for users who have already opted out)
    DEBUG: false //Debug mode - if active doesn't send any message nor post
}

export default c