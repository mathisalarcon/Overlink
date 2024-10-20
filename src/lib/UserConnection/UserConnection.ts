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
        await this.db.set(`users.${this.selfUser.id}.connections.${this.connection.user.id}.interactions`, this.cache.map((interaction) => interaction));
    }
}

export class OverlinkUserConnection {
    private self: Database;
	private client: Client;
	private db: QuickDB;
	private selfUser: OverlinkUser;

	user: OverlinkUser;
	interactions: OverlinkUserConnectionInteractionManager;

    constructor(self: Database, client: Client, db: QuickDB, selfUser: OverlinkUser, data: OverlinkUserConnectionData) {
        this.self = self;
		this.client = client;
		this.db = db;
        this.selfUser = selfUser;
        this.user = this.self.users.cache.get(data.userId);
        this.interactions = new OverlinkUserConnectionInteractionManager(self, client, db, selfUser, this, data.interactions);
	}

	get weight(): number {
		return this.interactions.cache.reduce((acc, interaction) => acc + interaction.weight, 0);
	}
}

export class OverlinkUserConnectionManager {
    private self: Database;
    private client: Client;
    private db: QuickDB;
    private selfUser: OverlinkUser;

    cache: Collection<string, OverlinkUserConnection>;

    constructor(self: Database, client: Client, db: QuickDB, selfUser: OverlinkUser, data: OverlinkUserConnectionData[]) {
        this.self = self;
        this.client = client;
        this.db = db;
        this.selfUser = selfUser;
        this.cache = new Collection(data.map((connection) => [connection.userId, new OverlinkUserConnection(this.self, client, db, selfUser, connection)]));
    }

    get(user: OverlinkUser): OverlinkUserConnection {
        return this.cache.get(user.id) as OverlinkUserConnection;
    }
}