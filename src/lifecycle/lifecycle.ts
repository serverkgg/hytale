import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { ASSETS_ARCHIVE, isServerInstalled, SERVER_AOT, SERVER_JAR, SERVER_READY } from "../shared";
import { heapFor, initialHeapFor } from "./heap";

const STOP_TIMEOUT_SECONDS = 120;

const STOP_COMMAND = "/stop";

const AUTH_MODE = "authenticated";

export const launchArguments = (options: { aot: boolean; heapMb: number; port: number }) => {
	return [
		"java",
		`-Xms${initialHeapFor(options.heapMb)}M`,
		`-Xmx${options.heapMb}M`,
		...(options.aot
			? [
					`-XX:AOTCache=${SERVER_AOT}`,
				]
			: []),
		"-jar",
		SERVER_JAR,
		"--assets",
		ASSETS_ARCHIVE,
		"--bind",
		`0.0.0.0:${options.port}`,
		"--auth-mode",
		AUTH_MODE,
	];
};

export const lifecycle: Bridge.Lifecycle = {
	kind: BridgeKind.Lifecycle,
	ready: SERVER_READY,
	stopTimeoutSeconds: STOP_TIMEOUT_SECONDS,
	async command(context) {
		if (!(await isServerInstalled(context))) {
			throw new Error("hytale is not installed yet");
		}

		return launchArguments({
			aot: await context.files.exists(SERVER_AOT),
			heapMb: heapFor(context.server.memoryMb),
			port: context.port("game"),
		});
	},
	async stop(context) {
		context.emit("ServerStopping");

		await context.command(STOP_COMMAND);
	},
};
