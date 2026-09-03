import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { sanitizeMessage, sendSay } from "../shared";

export const announce: Bridge.Announce = {
	kind: BridgeKind.Announce,
	async announce(context, message) {
		await sendSay(context, sanitizeMessage(message));
	},
};
