import { OverlinkUser } from "@/lib/User";
import {
	Client,
	Collection,
	CommandInteraction,
	AutocompleteInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
	User,
} from "discord.js";
import config from "~/data/config.json";

type CommandCategory = {
	name: string;
	commands: Collection<string, Command>;
};

export default {
	category: "Reputation",
	build(client: Client): SlashCommandBuilder {
		let command = new SlashCommandBuilder()
			.setName("profile")
			.setDescriptionLocalization(
				"fr",
				"Accédez à votre profil de réputation ou à celui d'un autre utilisateur."
			)
			.setDescription(
				"Access your reputation profile or someone else's."
			);

		command.addMentionableOption((option) =>
			option
				.setName("user")
				.setDescription("The user to get the profile of.")
				.setRequired(false)
		);

		return command;
	},
	async execute(client: Client, interaction: CommandInteraction) {
		const user: User =
			(interaction.options as any).getMentionable("user") ||
            interaction.user;
        
        if (user.bot) return interaction.reply({ content: "Bots don't have reputation profiles.", ephemeral: true });
        if(!user?.displayAvatarURL()) return interaction.reply({ content: "User not found.", ephemeral: true });
        
		if (!client.db.users.cache.has(user.id))
			await client.db.users.create(user.id);
		let userDoc = client.db.users.cache.get(user.id);

		let status = [
			{ max: 1000, text: "New Connector" },
			{ text: "Networker", max: 3000 },
			{ text: "Networker Pro", max: 5000 },
			{ text: "Solo Explorer", max: 10000 },
			{ text: "Inner Circle", max: 20000 },
			{ text: "Outreach Expert", max: 50000 },
        ];

		let userStatus = status
			.filter((s) => s.max > userDoc.statistics.reputation)
			.at(0).text;
		const embed = new EmbedBuilder()
			.setColor("Blue")
			.setAuthor({
				name: `${user.displayName}'s profile`,
				iconURL: user.displayAvatarURL(),
			})
			.setFooter({
				text: `Requested by ${interaction.user.tag}`,
				iconURL: interaction.user.displayAvatarURL(),
			})
			.setTimestamp()
			.setDescription(
				`> ${client.getEmoji(
					"reputation"
				)} • **Reputation :** ${parseFloat(
					userDoc.statistics.reputation.toFixed(2)
				).toLocaleString()} » *${userStatus} (${
					status.map((s) => s.text).indexOf(userStatus) + 1
				})*\n` +
					`> ${client.getEmoji(
						"network"
					)} • **Serveur connectés :** ${
						client.guilds.cache.filter((g) =>
							g.members.cache.has(user.id)
						).size
					}\n\u200b`
			)
			.setFields({
				name: `${client.getEmoji("podium")} • Meaningful connections`,
				value: Array.from(
                    client.db.users.cache.filter(u => u.connections.cache.has(user.id))
                        .sort((a, b) => b.connections.cache.get(user.id).weight - a.connections.cache.get(user.id).weight)
                        .values()
				)
					.slice(0, 5)
                    .map((u, i) => {
                        let targetUser = client.users.cache.get(u.id);
                        return `> **${
							i + 1
						}.** ${targetUser.toString()} » *${parseFloat(
							u.connections.cache.get(user.id).weight.toFixed(2)
						).toLocaleString()}*`;
					})
					.join("\n") || "> " + client.getEmoji('no') + " No connections yet.",
			});

		return interaction.reply({ embeds: [embed] });
	},
} as Command;
