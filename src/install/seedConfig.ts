import type { Bridge } from "@serverkgg/bridge";
import { CONFIG_FILE, mergeConfig, readConfig, SERVER_DIRECTORY } from "../shared";

const PAYLOAD_CONFIG = `${SERVER_DIRECTORY}/${CONFIG_FILE}`;

export const seedValues = (code: string): Bridge.Values => {
	return {
		ServerName: `Serverk ${code}`,
		MOTD: "Powered by serverk.gg",
	};
};

export const seedConfig = async (context: Bridge.Context) => {
	if (await context.files.exists(CONFIG_FILE)) {
		return false;
	}

	if (await context.files.exists(PAYLOAD_CONFIG)) {
		context.log("seeding config.json from the shipped defaults");

		await context.files.write(CONFIG_FILE, await context.files.read(PAYLOAD_CONFIG));
	} else {
		context.log("writing a fresh config.json");

		await context.files.write(CONFIG_FILE, "{}\n");
	}

	const current = await readConfig(context);
	const seeded = Object.fromEntries(
		Object.entries(seedValues(context.server.code)).filter(([key]) => {
			return String(current[key] ?? "").length === 0;
		}),
	);

	if (Object.keys(seeded).length > 0) {
		await mergeConfig(context, seeded);
	}

	return true;
};
