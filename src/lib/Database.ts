import { QuickDB } from "quick.db";

import config from "~/data/config.json";
import { OverlinkUserManager } from "./User";

export default class Database {
	private db: QuickDB;
	users: OverlinkUserManager;

	constructor() {
		this.db = new QuickDB({ filePath: config.database.filePath });
	}
}