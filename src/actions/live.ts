import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { activityExcerpt, BridgeEventName } from "@serverkgg/bridge/protocol";
import {
	allowPlayer,
	booleanArgument,
	disallowPlayer,
	messageArgument,
	sendSay,
	setWhitelist,
	usernameArgument,
} from "../shared";

export const WHITELIST_LIST = "whitelist";

const WHITELIST_ON: Bridge.Text = {
	ar: "تم تفعيل القائمة البيضاء",
	en: "Enabled the whitelist",
};

const WHITELIST_OFF: Bridge.Text = {
	ar: "تم إيقاف القائمة البيضاء",
	en: "Disabled the whitelist",
};

const allowed = (username: string): Bridge.Text => {
	return {
		ar: `تمت إضافة ${username} للقائمة البيضاء`,
		en: `Added ${username} to the whitelist`,
	};
};

const disallowed = (username: string): Bridge.Text => {
	return {
		ar: `تمت إزالة ${username} من القائمة البيضاء`,
		en: `Removed ${username} from the whitelist`,
	};
};

const announced = (excerpt: string): Bridge.Text => {
	return {
		ar: `تم إرسال إعلان للاعبين: «${excerpt}»`,
		en: `Sent an announcement to players: "${excerpt}"`,
	};
};

export const live: Bridge.Actions = {
	kind: BridgeKind.Actions,
	requiresRunning: true,
	actions: {
		async announce(context, args) {
			const message = messageArgument(args);

			await sendSay(context, message);

			const excerpt = activityExcerpt(message);

			context.activity.report({
				name: BridgeEventName.BroadcastSent,
				text: announced(excerpt),
				details: {
					excerpt,
				},
			});
		},

		async whitelist(context, args) {
			const enabled = booleanArgument(args, "enabled");

			await setWhitelist(context, enabled);

			context.activity.report({
				name: BridgeEventName.GameplayChanged,
				text: enabled ? WHITELIST_ON : WHITELIST_OFF,
				details: {
					what: WHITELIST_LIST,
					value: enabled,
				},
			});
		},

		async allow(context, args) {
			const username = usernameArgument(String(args.username ?? ""));

			await allowPlayer(context, username);

			context.activity.report({
				name: BridgeEventName.AccessGranted,
				text: allowed(username),
				subject: username,
				details: {
					list: WHITELIST_LIST,
				},
			});
		},

		async disallow(context, args) {
			const username = usernameArgument(String(args.username ?? ""));

			await disallowPlayer(context, username);

			context.activity.report({
				name: BridgeEventName.AccessRevoked,
				text: disallowed(username),
				subject: username,
				details: {
					list: WHITELIST_LIST,
				},
			});
		},
	},
};
