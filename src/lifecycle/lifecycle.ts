import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { prepareStage, stampVersion } from "../install";
import {
	BOOTSTRAP_JAR,
	bootedVersion,
	HytaleStage,
	heapArguments,
	SERVER_READY,
	START_SCRIPT,
	STOP_COMMAND,
} from "../shared";

const STOP_TIMEOUT_SECONDS = 120;

const AUTH_MODE = "authenticated";

const BOOT_LINES = 300;

export const bootstrapArguments = (memoryMb: number) => {
	return [
		"java",
		...heapArguments(memoryMb),
		"-jar",
		BOOTSTRAP_JAR,
		"--bootstrap",
		"--disable-sentry",
	];
};

export const serverArguments = (port: number) => {
	return [
		"bash",
		START_SCRIPT,
		"--bind",
		`0.0.0.0:${port}`,
		"--auth-mode",
		AUTH_MODE,
		"--disable-sentry",
	];
};

export const lifecycle: Bridge.Lifecycle = {
	kind: BridgeKind.Lifecycle,
	ready: SERVER_READY,
	stopTimeoutSeconds: STOP_TIMEOUT_SECONDS,
	async command(context) {
		const stage = await prepareStage(context);

		return stage === HytaleStage.Server
			? serverArguments(context.port("game"))
			: bootstrapArguments(context.server.memoryMb);
	},
	async stop(context) {
		context.emit("ServerStopping");

		await context.command(STOP_COMMAND);
	},
	async onReady(context) {
		for (const line of (await context.logs.tail(BOOT_LINES)).toReversed()) {
			const version = bootedVersion(line);

			if (version !== null) {
				await stampVersion(context, version);

				return;
			}
		}
	},
};
