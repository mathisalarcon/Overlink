import { ActivityType, channelLink, ChannelType, Client, EmbedBuilder, REST, Routes } from "discord.js";
import { success } from "@/utils";
import slogans from "~/data/slogans.json";
import config from "~/data/config.json";
import { error, info } from "console";
import Database from "@/lib/Database";
import path from "path";
import fs from "fs";

export default async function (client: Client) {
	await client.application.emojis.fetch();
    loadCommands(client);
    await deployCommands(client);
    client.db = new Database(client);
    await client.db.init();
    success('Logged in as ' + client.user?.tag);
    info('Running slogans');
    runSlogans(client);
    success('Slogans running');
    info('Sending login message');
    await sendLoginMessage(client);
    success('Login message sent');

	info(`Logged in as ${client.user?.tag}`);
	client.ready = true;
}

function runSlogans(client: Client) {
	let index = 0;
    setInterval(async () => {
        await setSlogan(client, index++ % slogans.length);
    }, 10000);
}
async function setSlogan(client: Client, index: number) {
	const slogan = slogans[index];
	await client.user?.setPresence({
		status: "online",
		activities: [
			{
				type: ActivityType.Custom,
				name: "Overlink",
				state: slogan,
			},
		],
	});
}

async function sendLoginMessage(client: Client) {
    const channel = client.channels.cache.get(config.login.messageChannelId);
    if (!channel) return console.log(error("[LOGIN] Could not find message channel"));
    if (channel.type == ChannelType.GuildText) {
        await channel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor('Green')
                    .setDescription(`Logged in`)
        ]});
    };
}

async function deployCommands(client: Client) {
    const rest = new REST().setToken(process.env.TOKEN);
	try {
		info("Started refreshing application (/) commands.");
		const data = await rest.put(
			Routes.applicationCommands(client.user.id),
			{
				body: client.commands.map((command) =>
					command.build(client).toJSON()
				),
			}
        );
        for (let cmd of data as any[]) {
            let newcmd = client.commands.get(cmd.name);
            if (!newcmd) continue;
            newcmd.id = cmd.id;
            client.commands.set(cmd.name, newcmd);
        }
		success(
			`Successfully reloaded ${
				(data as any[]).length
			} application (/) commands.`
		);
	} catch (e) {
		error(e);
		process.exit(1);
	}
}
function loadCommands(client: Client, dir = path.join(__dirname, "../commands")) {
	if (!fs.existsSync(dir)) return;
	fs.readdirSync(dir).forEach((file) => {
		if (fs.statSync(path.join(dir, file)).isDirectory())
			return loadCommands(client, path.join(dir, file));
		if (!file.endsWith(".js")) return;
        let command: Command = require(path.join(dir, file)).default;
        if (config.commands.categories[command.category]?.disabled || false) return;
		let builder = command.build(client);
		client.commands.set(builder.name, command);
	});
};