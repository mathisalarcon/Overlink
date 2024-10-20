import { ActivityType, channelLink, ChannelType, Client, EmbedBuilder } from "discord.js";
import { success } from "@/utils";
import slogans from "~/data/slogans.json";
import config from "~/data/config.json";
import { error, info } from "console";

export default async function (client: Client) {
    success('[LOGIN] Logged in as ' + client.user?.tag);
    info('[LOGIN] Running slogans');
    runSlogans(client);
    success('[LOGIN] Slogans running');
    info('[LOGIN] Sending login message');
    await sendLoginMessage(client);
    success('[LOGIN] Login message sent');

	info(`Logged in as ${client.user?.tag}`);
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
