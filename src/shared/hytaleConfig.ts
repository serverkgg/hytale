import type { Bridge } from "@serverkgg/bridge";
import { SERVER_DIRECTORY } from "./hytaleServer";

export const CONFIG_FILE = "config.json";

export const PERMISSIONS_FILE = "permissions.json";

export const SERVER_CONFIG_FILE = `${SERVER_DIRECTORY}/${CONFIG_FILE}`;

export const SERVER_PERMISSIONS_FILE = `${SERVER_DIRECTORY}/${PERMISSIONS_FILE}`;

export const UPDATE_SECTION = "Update";

export const BACKUP_SECTION = "Backup";

export const PATCHLINE = "release";

export const configPath = async (context: Bridge.Context) => {
	return (await context.files.exists(SERVER_CONFIG_FILE)) ? SERVER_CONFIG_FILE : CONFIG_FILE;
};

export const readConfig = async (context: Bridge.Context) => {
	return await context.codec.json.read(await configPath(context));
};

export const mergeConfig = async (context: Bridge.Context, values: Bridge.Values) => {
	await context.codec.json.merge(await configPath(context), values);
};

export const readSection = async (context: Bridge.Context, section: string): Promise<Bridge.Values> => {
	const path = await configPath(context);

	if (!(await context.files.exists(path))) {
		return {};
	}

	try {
		const parsed: unknown = JSON.parse(await context.files.read(path));
		const document =
			parsed === null || typeof parsed !== "object" || Array.isArray(parsed) ? {} : (parsed as Record<string, unknown>);
		const nested = document[section];

		if (nested === null || typeof nested !== "object" || Array.isArray(nested)) {
			return {};
		}

		const values: Bridge.Values = {};

		for (const [key, value] of Object.entries(nested)) {
			if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
				values[key] = value;
			}
		}

		return values;
	} catch {
		return {};
	}
};

export const mergeSection = async (context: Bridge.Context, section: string, values: Bridge.Values) => {
	const path = await configPath(context);
	const raw = (await context.files.exists(path)) ? await context.files.read(path) : "";
	const parsed: unknown = raw.trim().length === 0 ? {} : JSON.parse(raw);
	const document =
		parsed === null || typeof parsed !== "object" || Array.isArray(parsed) ? {} : (parsed as Record<string, unknown>);
	const existing = document[section];
	const current = existing !== null && typeof existing === "object" && !Array.isArray(existing) ? existing : {};

	await context.files.write(
		path,
		`${JSON.stringify(
			{
				...document,
				[section]: {
					...current,
					...values,
				},
			},
			null,
			2,
		)}\n`,
	);
};

export const maxPlayersOf = (config: Bridge.Values) => {
	const value = Number(config.MaxPlayers ?? Number.NaN);

	return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
};
