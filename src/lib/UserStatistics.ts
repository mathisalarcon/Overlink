import { Client } from "discord.js";
import { QuickDB } from "quick.db";
import { OverlinkUser } from "./User";
import Database from "./Database";

export class OverlinkStatisticsManager {
    private self: Database;
    private client: Client;
    private db: QuickDB;
    private user: OverlinkUser;

    reputation: number;

    constructor(self: Database, client: Client, db: QuickDB, user: OverlinkUser) {
        this.self = self;
        this.client = client;
        this.db = db;
        this.user = user;
    }
}