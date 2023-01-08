import type { User } from "./user.js"

export interface LeaderboardUser extends User{
    size: number,
    position: number,
    flair: string,
}