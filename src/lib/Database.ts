import { QuickDB } from "quick.db";

import config from "~/data/config.json";
import { OverlinkUserData, OverlinkUserManager } from "./User";
import path from "path";
import { Client } from "discord.js";

export default class Database {
	private client: Client;
	private db: QuickDB;
	users: OverlinkUserManager;

	constructor(client: Client) {
		let filePath = config.database.filePath
			.replace(/~/g, process.cwd())
			.replace(/@/g, path.join(process.cwd(), 'src'))
		
		this.client = client;
		this.db = new QuickDB({ filePath });
	}

	async init() {
		await this.fetchUsers();
	};

	private async fetchUsers() {
		if(!await this.db.has('users')) await this.db.set('users', {});
		const users: OverlinkUserData[] = Object.values(await this.db.get('users'));
		this.users = new OverlinkUserManager(this, this.client, this.db, users);
	}
}