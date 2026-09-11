import type { Bridge } from "@serverkgg/bridge";

export const SERVER_DIRECTORY = "Server";

export const BOOTSTRAP_JAR = "HytaleServer.jar";

export const AOT_CACHE_FILE = "HytaleServer.aot";

export const AUTH_STORE_FILE = "auth.enc";

export const AUTH_KEY_FILE = "auth.key";

export const SERVER_JAR = `${SERVER_DIRECTORY}/${BOOTSTRAP_JAR}`;

export const SERVER_AOT = `${SERVER_DIRECTORY}/${AOT_CACHE_FILE}`;

export const SERVER_AUTH_KEY_FILE = `${SERVER_DIRECTORY}/${AUTH_KEY_FILE}`;

export const ASSETS_ARCHIVE = "Assets.zip";

export const START_SCRIPT = "start.sh";

export const JVM_OPTIONS_FILE = "jvm.options";

export const UNIVERSE_DIRECTORY = `${SERVER_DIRECTORY}/universe`;

export const UPDATER_BACKUP_DIRECTORY = "updater/backup";

export const STOP_COMMAND = "/stop";

export const SAVE_WORLD_COMMAND = "/world save --all --confirm";

export const SAVE_WORLD_LINE = /Finished saving all worlds/;

export const PAYLOAD_FILES = [
	SERVER_JAR,
	ASSETS_ARCHIVE,
	START_SCRIPT,
];

export const SERVER_READY = /Hytale Server Booted!|Listening on \/\d{1,3}(?:\.\d{1,3}){3}:\d+/;

export const SERVER_BOOTING = /\[HytaleServer\] Booting up HytaleServer - Version: (?<version>[^,]+), Revision/;

export const SERVER_STOPPED = /\[HytaleServer\] Shutdown completed!/;

export enum HytaleStage {
	Bootstrap = "bootstrap",
	Server = "server",
}

export const stageFor = (present: string[]): HytaleStage => {
	return PAYLOAD_FILES.every((file) => present.includes(file)) ? HytaleStage.Server : HytaleStage.Bootstrap;
};

export const stageOf = async (context: Bridge.Context): Promise<HytaleStage> => {
	const present: string[] = [];

	for (const file of PAYLOAD_FILES) {
		if (await context.files.exists(file)) {
			present.push(file);
		}
	}

	return stageFor(present);
};

export const bootedVersion = (line: string) => {
	return line.match(SERVER_BOOTING)?.groups?.version?.trim() ?? null;
};
