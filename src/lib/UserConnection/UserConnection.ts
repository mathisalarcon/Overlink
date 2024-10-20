import uniqid from "uniqid";

import { Client, Collection } from "discord.js";
import { QuickDB } from "quick.db";
import { OverlinkUser } from "../User";
import Database from "../Database";

type OverlinkUserConnectionInteractionData = {
    id: string;
    weight: number;
    createdTimestamp: number;
    type: 'messages' | 'reaction' | 'voice' | 'video' | 'streaming' | 'mention' | 'kick' | 'ban';
}


export type OverlinkUserConnectionData = {
    userId: string;
    interactions: OverlinkUserConnectionInteractionData[];
};

export class OverlinkUserConnectionInteractionManager {
    private self: Database;
	private client: Client;
	private db: QuickDB;
    private selfUser: OverlinkUser;
    private connection: OverlinkUserConnection;

    cache: Collection<string, OverlinkUserConnectionInteractionData>;

    constructor(
        self: Database,
		client: Client,
		db: QuickDB,
		selfUser: OverlinkUser,
        connection: OverlinkUserConnection,
        data: OverlinkUserConnectionInteractionData[]
    ) {
        this.self = self;
		this.client = client;
		this.db = db;
        this.selfUser = selfUser;
        this.connection = connection;
        this.cache = new Collection(data.map((interaction) => [interaction.id, interaction]));
    };

    async add(weight: number, type: OverlinkUserConnectionInteractionData['type']): Promise<void> {
        const id = uniqid();
        this.cache.set(id, {
            id,
            weight,
            createdTimestamp: Date.now(),
            type
        });
        await this.db.set(`users.${this.selfUser.id}.connections.${this.connection.user.id}.interactions`, Array.from(this.cache.values()));
    }

    toJSON(): OverlinkUserConnectionInteractionData[] {
        return Array.from(this.cache.values());
    }
}

export class OverlinkUserConnection {
    private self: Database;
	private client: Client;
	private db: QuickDB;
    private selfUser: OverlinkUser;
    private data: OverlinkUserConnectionData;

	interactions: OverlinkUserConnectionInteractionManager;

    constructor(self: Database, client: Client, db: QuickDB, selfUser: OverlinkUser, data: OverlinkUserConnectionData) {
        this.self = self;
		this.client = client;
		this.db = db;
        this.selfUser = selfUser;
        this.data = data;
        this.interactions = new OverlinkUserConnectionInteractionManager(self, client, db, selfUser, this, data.interactions);
    }
    
    get user(): OverlinkUser {
        return this.self.users.cache.get(this.data.userId);
    }

	get weight(): number {
		return this.interactions.cache.reduce((acc, interaction) => acc + interaction.weight, 0);
    }
    
    toJSON(): OverlinkUserConnectionData {
        return {
            userId: this.user.id,
            interactions: this.interactions.toJSON()
        };
    }
}

export class OverlinkUserConnectionManager {
    private self: Database;
    private client: Client;
    private db: QuickDB;
    private selfUser: OverlinkUser;

    cache: Collection<string, OverlinkUserConnection>;

    constructor(self: Database, client: Client, db: QuickDB, selfUser: OverlinkUser, data: { [userId: string]: OverlinkUserConnectionData }) {
        this.self = self;
        this.client = client;
        this.db = db;
        this.selfUser = selfUser;
        this.cache = new Collection(Object.entries(data).map(([userId, connectionData]) => [userId, new OverlinkUserConnection(self, client, db, selfUser, connectionData)]));
    }

    async create(targetId: string) {
        if(!this.self.users.cache.has(targetId)) await this.self.users.create(targetId);
        const connection = new OverlinkUserConnection(this.self, this.client, this.db, this.selfUser, {
            userId: targetId,
            interactions: []
        });

        this.cache.set(targetId, connection);
        await this.db.set(`users.${this.selfUser.id}.connections.${targetId}`, connection.toJSON());
        return connection;
    }

    toJSON(): { [userId: string]: OverlinkUserConnectionData } {
        return Object.fromEntries(
			this.cache.map((connection) => [
				connection.user.id,
				connection.toJSON(),
			])
		);
    }
}