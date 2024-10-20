import { Client, EmojiResolvable, Colors, Collection } from "discord.js";
import { QuickDB } from "quick.db";
// badges as OverlinkBadgeJSON
import badges from "~/data/badges.json";
import { OverlinkUser } from "./User";
import Database from "./Database";


export type OverlinkBadgeData = {
    slug: string;
    obtainedTimestamp: number;
}
type OverlinkBadgeJSON = {
	slug: string;
	name: TranslatedValues;
	description: TranslatedValues;
	emoji: string;
	color: string | number;
};

export class OverlinkBadge {
    private self: Database;
	private client: Client;
    private db: QuickDB;
    private user: OverlinkUser;

	slug: string;
	name: TranslatedValues;
	description: TranslatedValues;
	emoji: EmojiResolvable;
	obtainedTimestamp: number;

    constructor(self: Database, client: Client, db: QuickDB, user: OverlinkUser, data: OverlinkBadgeData) {
        this.self = self;
		this.client = client;
        this.db = db;
        this.user = user;

        const badgeJSON = Object.values(badges).find(
            (badge) => badge.slug === data.slug
        ) as OverlinkBadgeJSON;

        this.slug = badgeJSON.slug;
        this.name = badgeJSON.name;
        this.description = badgeJSON.description;
        this.emoji = badgeJSON.emoji;
        this.obtainedTimestamp = data.obtainedTimestamp;
    }

    get obtainedAt(): Date {
        return new Date(this.obtainedTimestamp);
    }
    get timeSinceObtained(): number {
        return Date.now() - this.obtainedTimestamp;
    }

    async remove(): Promise<void> {
        this.user.badges.cache.delete(this.slug);
        await this.db.set(`users.${this.client.user!.id}.badges`, this.user.badges.cache.map((badge) => badge.toJSON()));
    }
    
    toJSON(): OverlinkBadgeData {
        return {
            slug: this.slug,
            obtainedTimestamp: this.obtainedTimestamp
        };
    }
}

export class OverlinkUserBadgeManager {
    private self: Database;
    private client: Client;
    private db: QuickDB;
    private user: OverlinkUser;
    
    cache: Collection<string, OverlinkBadge>;

    constructor(self: Database, client: Client, db: QuickDB, user: OverlinkUser, data: OverlinkBadgeData[]) {
        this.self = self;
        this.client = client;
        this.db = db;
        this.user = user;
        this.cache = new Collection(data.map((badge) => [badge.slug, new OverlinkBadge(this.self, client, db, user, badge)]));
    };

    async add(slug: string): Promise<OverlinkBadge> {
        const badge = new OverlinkBadge(this.self, this.client, this.db, this.user, {
            slug,
            obtainedTimestamp: Date.now()
        });

        await this.db.push(`users.${this.client.user!.id}.badges`, badge.toJSON());
        this.cache.set(slug, badge);
        return badge;
    };
}