import type { Bridge } from "@serverkgg/bridge";

export const CONFIG_FILE = "config.json";

export const readConfig = async (context: Bridge.Context) => {
	if (!(await context.files.exists(CONFIG_FILE))) {
		return {};
	}

	return await context.codec.json.read(CONFIG_FILE);
};

export const mergeConfig = async (context: Bridge.Context, values: Bridge.Values) => {
	await context.codec.json.merge(CONFIG_FILE, values);
};

export const maxPlayersOf = (config: Bridge.Values) => {
	const value = Number(config.MaxPlayers ?? Number.NaN);

	return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
};
