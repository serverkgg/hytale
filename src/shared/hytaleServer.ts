import type { Bridge } from "@serverkgg/bridge";

export const SERVER_DIRECTORY = "Server";

export const BOOTSTRAP_JAR = "HytaleServer.jar";

export const SERVER_JAR = `${SERVER_DIRECTORY}/${BOOTSTRAP_JAR}`;

export const SERVER_AOT = `${SERVER_DIRECTORY}/HytaleServer.aot`;

export const ASSETS_ARCHIVE = "Assets.zip";

export const START_SCRIPT = "start.sh";

export const JVM_OPTIONS_FILE = "jvm.options";

export const UNIVERSE_DIRECTORY = `${SERVER_DIRECTORY}/universe`;

export const STOP_COMMAND = "/stop";

export const PAYLOAD_FILES = [
	SERVER_JAR,
	ASSETS_ARCHIVE,
	START_SCRIPT,
];

export const SERVER_READY = /Hytale Server Booted!|Listening on \/\d{1,3}(?:\.\d{1,3}){3}:\d+/;

export const SERVER_BOOTING = /\[HytaleServer\] Booting up HytaleServer - Version: (?<version>[^,]+), Revision/;

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
