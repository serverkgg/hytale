import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { banPlayer, kickPlayer, playerRoster, rosterPresenceOf, rosterUsernameOf } from "../shared";

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
			const username = rosterUsernameOf(row);

			await kickPlayer(context, username);

			context.emit(BridgeEventName.PlayerKicked, rosterPresenceOf(row));

			context.log("kicked a player", {
				username,
			});
		},
		async ban(context, row) {
			const username = rosterUsernameOf(row);

			await banPlayer(context, username);

			context.emit(BridgeEventName.PlayerBanned, rosterPresenceOf(row));

			context.log("banned a player", {
				username,
			});
		},
	},
};
