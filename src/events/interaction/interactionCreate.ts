import { AutocompleteInteraction, Client, CommandInteraction, Interaction } from "discord.js";
import { error } from "@/utils";

export default async function (client: Client, interaction: Interaction) {
    try {
        if(!client.ready) return await (interaction as CommandInteraction).reply({ content: 'The bot is not ready yet, please wait a few seconds.', ephemeral: true });
    } catch { };
    if (interaction.isCommand()) {
        await executeCommand(client, interaction as CommandInteraction);
    } else if (interaction.isAutocomplete()) {
        await executeAutocomplete(client, interaction);
    }
};

async function executeCommand(client: Client, interaction: CommandInteraction) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(client, interaction);
    } catch (err) {
        error(err);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
}
async function executeAutocomplete(client: Client, interaction: AutocompleteInteraction) {
    const command = client.commands.get(interaction.commandName);
    if(!command) return;

    try {
        await command.autocomplete(client, interaction);
    } catch (err) {
        error(err);
    }
}