import Snoowrap from 'snoowrap';
import { parse } from 'yaml';
import { Collection } from 'mongodb';

export async function getFlairList(db: Collection<FlairDB>, original: Flair[]) {
    try {
        const flairs = await db.find({ id: { $exists: true } }).project({ _id: 0, flair: 1, id: 1 }).toArray() as Flair[];

        return flairs;
    } catch (e) {
        console.log(e);

        return original;    //In case of errors don't update the array
    }
}

export async function checkNewFlairs(r: Snoowrap, db: Collection<FlairDB>) {
    try {
        const wiki = r.getSubreddit('PoliticalCompassMemes').getWikiPage('flair_ids');
        const body = await wiki.content_md;

        const res = parse(body);   //Parse YAML text to JSON

        const flairs: Flair[] = [];
        Object.keys(res.data_flaired).forEach(id => flairs.push(new Flair(res.data_flaired[id], id)));

        for (const entry of flairs) {   //Automatically add any new flair (from the wiki) to the dataFlaired
            const result = await db.findOne({ id: entry.id });
            if (result === null) {
                await db.insertOne({ flair: entry.flair, id: entry.id, path: "", special: true });
                console.log('New flair added to wiki:', entry.flair);
            }
        }
    } catch (e) { console.log(e) }
}

export class Flair {
    flair: string;
    id: string; //This is actually optional in the DB

    constructor(flair: string, id: string) {
        this.flair = flair;
        this.id = id;
    }
}

export interface FlairDB extends Flair {
    contest?: number;   //0 for past contests, numbered for ongoing ones
    owner?: string; //Flair owner, for flairs owned by a single user
    path: string; //Image path for the emoji
    references?: FlairDB;   //Original flair, for redundant ones
    special: boolean; //false for OG flairs available to everyone, true otherwise
}