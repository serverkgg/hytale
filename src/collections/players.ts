import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { banPlayer, kickPlayer, playerRoster } from "../shared";

const REFRESH_SECONDS = 20;

const presenceOf = (row: Bridge.Row): Bridge.Values => {
	return {
		player: typeof row.name === "string" && row.name.length > 0 ? row.name : row.id,
	};
};

export const players: Bridge.Collection = {
	kind: BridgeKind.Collection,
	requiresRunning: true,
	refreshSeconds: REFRESH_SECONDS,
	async list(context) {
		return await playerRoster(context);
	},
	actions: {
		async kick(context, row) {
			await kickPlayer(context, row.id);

			context.emit(BridgeEventName.PlayerKicked, presenceOf(row));

			context.log("kicked a player", {
				username: row.id,
			});
		},
		async ban(context, row) {
			await banPlayer(context, row.id);

			context.emit(BridgeEventName.PlayerBanned, presenceOf(row));

			context.log("banned a player", {
				username: row.id,
			});
		},
	},
};
