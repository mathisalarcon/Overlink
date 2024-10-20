import { Client, Collection, CommandInteraction, AutocompleteInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import config from "~/data/config.json";

type CommandCategory = {
    name: string;
    commands: Collection<string, Command>;
};

export default {
	category: "General",
	build(client: Client): SlashCommandBuilder {
		let command = new SlashCommandBuilder()
			.setName("help")
			.setDescriptionLocalization(
				"fr",
				"Affiche la liste des commandes ou les informations sur une commande spécifique."
			)
			.setDescription(
				"Shows a list of commands or information about a specific command."
			);

		command.addStringOption((option) =>
			option
				.setName("command")
				.setDescriptionLocalization(
					"fr",
					"Le nom de la commande à obtenir."
				)
				.setDescription("The name of the command to get.")
				.setRequired(false)
				.setAutocomplete(true)
		);

		return command;
	},
	async execute(client: Client, interaction: CommandInteraction) {
		let categories = new Collection<string, CommandCategory>();
		client.commands.forEach((command) => {
			if (!categories.has(command.category))
				categories.set(command.category, {
					name: command.category,
					commands: new Collection(),
				});
			categories
				.get(command.category)
				.commands.set(command.build(client).name, command);
		});

		return interaction.reply({
			embeds: [
				new EmbedBuilder().setColor("Blue").setFields(
					categories.map((category) => ({
						name:
							client.getEmoji(config.commands.categories[category.name]?.emoji) +
							" " +
							category.name,
						value: category.commands
							.map(
								(command) =>
									`- </${command.build(client).name}:${
										command.id
									}>`
							)
							.join("\n"),
						inline: true,
					}))
				),
			],
			ephemeral: true,
		});
	},
    async autocomplete(client: Client, interaction: AutocompleteInteraction) {
        const focusedValue = interaction.options.getFocused();
        const commands = client.commands.filter((cmd: Command) => cmd.build(client).name.includes(focusedValue));
        await interaction.respond(
			commands.map((choice: Command) => ({
				name: choice.category + " • " + choice.build(client).name,
				value: choice.build(client).name,
			}))
		);
    },
} as Command;