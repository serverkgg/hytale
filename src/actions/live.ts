import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import {
	allowPlayer,
	booleanArgument,
	disallowPlayer,
	messageArgument,
	sendSay,
	setWhitelist,
	usernameArgument,
} from "../shared";

export const live: Bridge.Actions = {
	kind: BridgeKind.Actions,
	requiresRunning: true,
	actions: {
		async announce(context, args) {
			await sendSay(context, messageArgument(args));
		},

		async whitelist(context, args) {
			await setWhitelist(context, booleanArgument(args, "enabled"));
		},

		async allow(context, args) {
			await allowPlayer(context, usernameArgument(String(args.username ?? "")));
		},

		async disallow(context, args) {
			await disallowPlayer(context, usernameArgument(String(args.username ?? "")));
		},
	},
};
