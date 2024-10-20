export {};

declare global {
	interface TranslatedValues {
		fr?: string;
		en?: string;
	}
	namespace NodeJS {
		interface ProcessEnv {
			TOKEN: string;
		}
	}
}
