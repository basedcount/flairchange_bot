//Database user
export interface User {
    id: string,
    name: string,
    flairs: Flair[],
    optOut?: boolean
}

//Element in the Flairs[] array of a database user
export interface Flair {
    dateAdded: Date,
    flair: string,
    event?: boolean
}