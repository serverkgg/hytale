import type { Bridge } from "@serverkgg/bridge";

const OWNER_ONLY_MODE = "600";

export const ensureAuthKey = async (context: Bridge.Context, path: string) => {
	if (await context.files.exists(path)) {
		return false;
	}

	await context.files.write(path, crypto.randomUUID());
	await context.exec([
		"chmod",
		OWNER_ONLY_MODE,
		path,
	]);

	context.log("generated the key that keeps the hytale sign-in encrypted on disk", {
		path,
	});

	return true;
};
