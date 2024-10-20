export {};

declare global {
	interface TranslatedValues {
		fr?: string;
		en?: string;
	}
	type Command = {
		id?: string;
		category: string;
		build(client: Client): SlashCommandBuilder;
		execute(client: Client, interaction: CommandInteraction): Promise<unknown>;
		autocomplete?(client: Client, interaction: AutocompleteInteraction): Promise<unknown>;
	};
	namespace NodeJS {
		interface ProcessEnv {
			TOKEN: string;
		}
	}
}
