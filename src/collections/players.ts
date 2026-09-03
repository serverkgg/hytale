import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { banPlayer, kickPlayer, playerRoster } from "../shared";

const REFRESH_SECONDS = 20;

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
		},
		async ban(context, row) {
			await banPlayer(context, row.id);
		},
	},
};
