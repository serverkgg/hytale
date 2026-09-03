import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { HytaleStage, maxPlayersOf, playerRoster, readConfig, stageOf } from "../shared";

const REFRESH_SECONDS = 60;

export const query: Bridge.Query = {
	kind: BridgeKind.Query,
	refreshSeconds: REFRESH_SECONDS,
	async sample(context) {
		const max = maxPlayersOf(await readConfig(context));

		if ((await stageOf(context)) === HytaleStage.Bootstrap) {
			return {
				online: null,
				max,
			};
		}

		try {
			return {
				online: (await playerRoster(context)).length,
				max,
			};
		} catch {
			return {
				online: null,
				max,
			};
		}
	},
};
