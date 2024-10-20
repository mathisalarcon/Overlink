import { Client } from 'discord.js';
import { QuickDB } from 'quick.db';
import { OverlinkBadgeData, OverlinkUserBadgeManager } from './Badge';
import { OverlinkStatisticsManager } from './UserStatistics';
import Database from './Database';
import { OverlinkUserConnectionData, OverlinkUserConnectionManager } from './UserConnection/UserConnection';

export type OverlinkUserData = {
    id: string;
    reputation: number;
    badges: OverlinkBadgeData[];
    connections: OverlinkUserConnectionData[];
    statistics: OverlinkStatisticsData;
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
        this.statistics.reputation = data.reputation;
	}
};

export class OverlinkUserManager {};