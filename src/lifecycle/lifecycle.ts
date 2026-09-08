import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { prepareStage, readInstallStamp, stampVersion } from "../install";
import { advanceSetup } from "../setup";
import {
	BOOTSTRAP_JAR,
	bootedVersion,
	HytaleStage,
	heapArguments,
	SERVER_READY,
	SERVER_STOPPED,
	START_SCRIPT,
	STOP_COMMAND,
	UPDATER_BACKUP_DIRECTORY,
} from "../shared";

const STOP_TIMEOUT_SECONDS = 120;

const STOP_REPLY_TIMEOUT_MS = 60_000;

const AUTH_MODE = "authenticated";

const BOOT_LINES = 300;

export const bootstrapArguments = (memoryMb: number) => {
	return [
		"java",
		...heapArguments(memoryMb),
		"-jar",
		BOOTSTRAP_JAR,
		"--bootstrap",
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
	];
};

const stampBootedVersion = async (context: Bridge.Context) => {
	for (const line of (await context.logs.tail(BOOT_LINES)).toReversed()) {
		const version = bootedVersion(line);

		if (version === null) {
			continue;
		}

		const previous = (await readInstallStamp(context))?.version ?? null;

		if ((await stampVersion(context, version)) && previous !== null) {
			context.emit(BridgeEventName.ServerUpdated, {
				from: previous,
				to: version,
			});
		}

		return;
	}
};

const pruneUpdaterBackup = async (context: Bridge.Context) => {
	if (!(await context.files.exists(UPDATER_BACKUP_DIRECTORY))) {
		return;
	}

	await context.files.remove(UPDATER_BACKUP_DIRECTORY);

	context.log("the updated server booted, dropped the previous files the updater kept for a rollback");
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
		context.emit(BridgeEventName.ServerStopping);

		await context.command(STOP_COMMAND, {
			expect: SERVER_STOPPED,
			timeoutMs: STOP_REPLY_TIMEOUT_MS,
		});
	},
	async onReady(context) {
		await stampBootedVersion(context);
		await pruneUpdaterBackup(context);
		await advanceSetup(context);
	},
};
