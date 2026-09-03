import type { Bridge } from "@serverkgg/bridge";

export const STAMP_FILE = ".serverk-install.json";

export interface InstallStamp {
	installer: string;
	version: string | null;
}

export const parseStamp = (raw: string): InstallStamp | null => {
	try {
		const parsed = JSON.parse(raw) as Partial<InstallStamp>;

		if (typeof parsed.installer !== "string" || parsed.installer.length === 0) {
			return null;
		}

		return {
			installer: parsed.installer,
			version: typeof parsed.version === "string" && parsed.version.length > 0 ? parsed.version : null,
		};
	} catch {
		return null;
	}
};

export const readStamp = async (context: Bridge.Context): Promise<InstallStamp | null> => {
	if (!(await context.files.exists(STAMP_FILE))) {
		return null;
	}

	return parseStamp(await context.files.read(STAMP_FILE));
};

export const writeStamp = async (context: Bridge.Context, stamp: InstallStamp) => {
	await context.files.write(STAMP_FILE, `${JSON.stringify(stamp, null, 2)}\n`);
};

export const stampVersion = async (context: Bridge.Context, version: string) => {
	const stamp = await readStamp(context);

	if (stamp?.version === version) {
		return false;
	}

	await writeStamp(context, {
		installer: stamp?.installer ?? version,
		version,
	});

	return true;
};
