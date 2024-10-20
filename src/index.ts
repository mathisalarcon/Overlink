import { Client, GatewayIntentBits, IntentsBitField, Partials } from "discord.js";
import "module-alias/register";
import { config } from "dotenv";
import path from "path";
import fs from "fs";
import Database from "@/lib/Database";

config();

let client = new Client({
    intents: Object.values(IntentsBitField.Flags) as GatewayIntentBits[],
    partials: Object.values(Partials) as Partials[]
});

client.db = new Database();

function loadEvents(dir = path.join(__dirname, "events")) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(file => {
        if (fs.statSync(path.join(dir, file)).isDirectory()) return loadEvents(path.join(dir, file));
        if (!file.endsWith(".js")) return;
        client.on(
            file.split('.').slice(0, -1).join('.'),
            (...args) => require(path.join(dir, file)).default(client, ...args)
        )
    });
}; loadEvents();

client.login(process.env.TOKEN);