import {
	Client,
	Collection,
	CommandInteraction,
	AutocompleteInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";
import config from "~/data/config.json";

type CommandCategory = {
	name: string;
	commands: Collection<string, Command>;
};

export default {
	category: "About the bot",
	build(client: Client): SlashCommandBuilder {
		let command = new SlashCommandBuilder()
			.setName("credits")
			.setDescriptionLocalization(
				"fr",
				"Tout le monde qui a contribué à ce projet."
			)
			.setDescription("Everyone who contributed to this project.");

		return command;
	},
	async execute(client: Client, interaction: CommandInteraction) {
		return interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor("Blue")
					.setTitle("Credits")
					.setDescription(
						"Everyone who contributed to this project.\n\n" +
							[
								client.getEmoji(config.credits.staff.emoji) +
									" **" +
									config.credits.staff.name +
									"**",
								config.credits.staff.developers
									.map(
										(dev) =>
											`- <@${dev.discordId}> » ${dev.role}`
									)
									.join("\n") || "Aucun",
								"",
								client.getEmoji(config.credits.design.emoji) +
									" **" +
									config.credits.design.name +
									"**",
								"Designers :",
								config.credits.design.users
									.map(
										(user) =>
											`- <@${user.discordId}> » (${user.role})`
									)
									.join("\n") || "Aucun",
								"Plateformes :",
								config.credits.design.platforms
									.map(
										(platform) =>
											`- ${client.getEmoji(
												platform.emoji
											)} [${platform.name}](${
												platform.url
											}) » ${platform.role}`
									)
									.join("\n") || "Aucune",
								"",
								client.getEmoji(
									config.credits.technologies.emoji
								) +
									" **" +
									config.credits.technologies.name +
									"**",
								config.credits.technologies.list
									.map(
										(tech) =>
											`- ${client.getEmoji(
												tech.emoji
											)} [${tech.name}](${tech.url}) » ${tech.role}`
									)
									.join("\n") || "Aucune",
							].join("\n")
					),
			],
			ephemeral: true,
		});
	},
} as Command;
