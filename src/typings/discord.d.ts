import Database from "@/lib/Database";
import { Client } from "discord.js";

declare module "discord.js" {
    interface Client {
        db: Database;
        commands: Collection<string, Command>;
        getEmoji(name: string): string;
        ready: boolean;
    }
}