import type { Bridge } from "@serverkgg/bridge";

export const SERVER_DIRECTORY = "Server";

export const SERVER_JAR = `${SERVER_DIRECTORY}/HytaleServer.jar`;

export const SERVER_AOT = `${SERVER_DIRECTORY}/HytaleServer.aot`;

export const ASSETS_ARCHIVE = "Assets.zip";

export const UNIVERSE_DIRECTORY = "universe";

export const SERVER_READY = /Hytale Server Booted!|Listening on \/\d{1,3}(?:\.\d{1,3}){3}:\d+/;

export const SERVER_BOOTING = /\[HytaleServer\] Booting up HytaleServer - Version: (?<version>[^,]+), Revision/;

export const isServerInstalled = async (context: Bridge.Context) => {
	return (await context.files.exists(SERVER_JAR)) && (await context.files.exists(ASSETS_ARCHIVE));
};

export const bootedVersion = (line: string) => {
	return line.match(SERVER_BOOTING)?.groups?.version?.trim() ?? null;
};
