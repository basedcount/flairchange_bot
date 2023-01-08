//Callers of the !flairs command - homemade ratelimit
export interface Caller {
    id: string, //Reddit ID (fullname)
    date: Date,//Last call
}