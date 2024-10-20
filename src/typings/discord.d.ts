import Database from "@/lib/Database";
import { Client } from "discord.js";

declare module "discord.js" {
    interface Client {
        db: Database;
    }
}