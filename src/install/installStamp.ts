import type { Bridge } from "@serverkgg/bridge";
import { readStamp, writeStamp } from "@serverkgg/bridge/install";

export interface InstallStamp {
	installer: string;
	version: string | null;
}

export const installStampOf = (raw: Record<string, unknown> | null): InstallStamp | null => {
	if (raw === null) {
		return null;
	}

	const installer = raw.installer;

	if (typeof installer !== "string" || installer.length === 0) {
		return null;
	}

	const version = raw.version;

	return {
		installer,
		version: typeof version === "string" && version.length > 0 ? version : null,
	};
};

export const readInstallStamp = async (context: Bridge.Context): Promise<InstallStamp | null> => {
	return installStampOf(await readStamp(context));
};

export const stampVersion = async (context: Bridge.Context, version: string) => {
	const stamp = await readInstallStamp(context);

	if (stamp?.version === version) {
		return false;
	}

	await writeStamp<InstallStamp>(context, {
		installer: stamp?.installer ?? version,
		version,
	});

	return true;
};
