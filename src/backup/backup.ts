import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { HytaleStage, SAVE_WORLD_COMMAND, SAVE_WORLD_LINE, stageOf } from "../shared";

const SETTLE_SECONDS = 5;

const SAVE_TIMEOUT_MS = 60_000;

export const backup: Bridge.Backup = {
	kind: BridgeKind.Backup,
	settleSeconds: SETTLE_SECONDS,
	async quiesce(context) {
		if (!context.server.running) {
			return;
		}

		if ((await stageOf(context)) !== HytaleStage.Server) {
			return;
		}

		const saved = context.logs.watch(SAVE_WORLD_LINE, SAVE_TIMEOUT_MS);

		await context.command(SAVE_WORLD_COMMAND);

		if ((await saved) === null) {
			throw new Error("the world did not report itself saved before the backup");
		}

		context.log("saved the world before the backup");
	},
};
