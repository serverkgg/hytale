import type { Bridge } from "@serverkgg/bridge";

const SPACING = /\s+/g;

const QUOTES = /["']/g;

export const ANNOUNCE_MESSAGE_LENGTH = 200;

export const SAY_COMMAND = "/say";

export const KICK_COMMAND = "/kick";

export const BAN_COMMAND = "/ban";

export const WHITELIST_ENABLE_COMMAND = "/whitelist enable";

export const WHITELIST_DISABLE_COMMAND = "/whitelist disable";

export const WHITELIST_STATUS_COMMAND = "/whitelist status";

export const WHITELIST_LIST_COMMAND = "/whitelist list";

export const WHITELIST_ADD_COMMAND = "/whitelist add";

export const WHITELIST_REMOVE_COMMAND = "/whitelist remove";

export const sanitizeMessage = (raw: string) => {
	return raw.replaceAll(QUOTES, "").replaceAll(SPACING, " ").trim();
};

export const messageArgument = (args: Bridge.Values) => {
	const message = sanitizeMessage(String(args.message ?? ""));

	if (message.length === 0) {
		throw new Error("اكتب الرسالة أول — write the message first");
	}

	return message.slice(0, ANNOUNCE_MESSAGE_LENGTH);
};

export const booleanArgument = (args: Bridge.Values, key: string) => {
	const value = args[key];

	return value === true || value === "true" || value === 1 || value === "1";
};

export const usernameArgument = (raw: string) => {
	const username = raw.trim();

	if (!/^[A-Za-z0-9_.-]{1,32}$/.test(username)) {
		throw new Error(`"${username}" ما يشبه اسم لاعب — that is not a player name`);
	}

	return username;
};

export const sendSay = async (context: Bridge.Context, message: string) => {
	await context.command(`${SAY_COMMAND} ${message}`);
};

export const kickPlayer = async (context: Bridge.Context, username: string) => {
	await context.command(`${KICK_COMMAND} ${usernameArgument(username)}`);
};

export const banPlayer = async (context: Bridge.Context, username: string) => {
	await context.command(`${BAN_COMMAND} ${usernameArgument(username)}`);
};

export const setWhitelist = async (context: Bridge.Context, enabled: boolean) => {
	await context.command(enabled ? WHITELIST_ENABLE_COMMAND : WHITELIST_DISABLE_COMMAND);
};

export const allowPlayer = async (context: Bridge.Context, username: string) => {
	await context.command(`${WHITELIST_ADD_COMMAND} ${usernameArgument(username)}`);
};
