import { Client, Collection } from 'discord.js';
import { QuickDB } from 'quick.db';
import { OverlinkBadgeData, OverlinkUserBadgeManager } from './Badge';
import { OverlinkStatisticsManager } from './UserStatistics';
import Database from './Database';
import { OverlinkUserConnectionData, OverlinkUserConnectionManager } from './UserConnection/UserConnection';

export type OverlinkUserData = {
    id: string;
    reputation: number;
    badges: OverlinkBadgeData[];
    connections: { [userId: string]: OverlinkUserConnectionData };
    // statistics: OverlinkStatisticsData;
    // preferences: OverlinkPreferencesData;
}

export class OverlinkUser {
    private self: Database;
	private client: Client;
	private db: QuickDB;

	id: string;
	connections: OverlinkUserConnectionManager;
	badges: OverlinkUserBadgeManager;
	statistics: OverlinkStatisticsManager;
	// preferences: OverlinkPreferencesManager;

    constructor(self: Database, client: Client, db: QuickDB, data: OverlinkUserData) {
        this.self = self;
		this.client = client;
		this.db = db;

		this.id = data.id;
        this.badges = new OverlinkUserBadgeManager(this.self, client, db, this, data.badges);
        this.statistics = new OverlinkStatisticsManager(this.self, client, db, this);
        this.connections = new OverlinkUserConnectionManager(this.self, client, db, this, data.connections);
    }
    
    toJSON(): OverlinkUserData {
        return {
            id: this.id,
            reputation: this.statistics.reputation,
            badges: this.badges.cache.map((badge) => badge.toJSON()),
            connections: this.connections.toJSON()
        };
    }
};

export class OverlinkUserManager {
    private self: Database;
    private client: Client;
    private db: QuickDB;

    cache: Collection<string, OverlinkUser>;

    constructor(self: Database, client: Client, db: QuickDB, data: OverlinkUserData[]) {
        this.self = self;
        this.client = client;
        this.db = db;
        this.cache = new Collection(data.map((user) => [user.id, new OverlinkUser(self, client, db, user)]));
    };

    async create(id: string) {
        const user = new OverlinkUser(this.self, this.client, this.db, {
            id,
            reputation: 0,
            badges: [],
            connections: {}
        });

        this.cache.set(id, user);
        await this.db.set(`users.${id}`, user.toJSON());
        return user;
    }
};