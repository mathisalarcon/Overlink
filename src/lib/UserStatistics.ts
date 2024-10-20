import { Client } from "discord.js";
import { QuickDB } from "quick.db";
import { OverlinkUser } from "./User";
import Database from "./Database";

export class OverlinkStatisticsManager {
    private self: Database;
    private client: Client;
    private db: QuickDB;
    private user: OverlinkUser;

    constructor(self: Database, client: Client, db: QuickDB, user: OverlinkUser) {
        this.self = self;
        this.client = client;
        this.db = db;
        this.user = user;
    }

    get reputation() {
        return this.self.users.cache.filter(u => u.connections.cache.has(this.user.id)).reduce((acc, u) => acc + u.connections.cache.get(this.user.id).weight, 0);
    }
}