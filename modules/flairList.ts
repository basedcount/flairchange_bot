import Snoowrap from 'snoowrap';
import { parse } from 'yaml';

export async function getFlairList(r: Snoowrap) {
    const wiki = r.getSubreddit('PoliticalCompassMemes').getWikiPage('flair_ids');
    const body = await wiki.content_md;
    
    const res = parse(body);   //Parse YAML text to JSON
    
    const flairs: Flair[] = [];
    Object.keys(res.data_flaired).forEach(id => flairs.push(new Flair(res.data_flaired[id], id)));

    return flairs;
}

export class Flair {
    name: string;
    id: string;

    constructor(flair: string, id: string) {
        this.name = flair;
        this.id = id;
    }
}