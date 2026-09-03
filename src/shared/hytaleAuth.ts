import type { Bridge } from "@serverkgg/bridge";
import { consoleOutput } from "./hytaleConsole";

export const AUTH_STATUS_COMMAND = "/auth status";

export const AUTH_LOGIN_COMMAND = "/auth login device";

export const AUTH_LOGOUT_COMMAND = "/auth logout";

export const AUTH_PERSISTENCE_COMMAND = "/auth persistence Encrypted";

export const VERIFY_URL = /(?<url>https:\/\/\S*device\S*[?&]user_code=(?<code>[A-Za-z0-9][A-Za-z0-9-]{3,31}))/;

const LOGIN_TIMEOUT_MS = 45_000;

const SIGNED_OUT = /\bNot authenticated\b|\bServer is not currently authenticated\b|\bServer logged out\b/i;

const SIGNED_IN = /\bAuthentication successful\b|\bAuthenticated \(mTLS \+ JWT\)\b|\bOAuth (?:Device|Store|Browser)\b/i;

const MODE = /\bMode:\s*(?<mode>[A-Za-z][A-Za-z _-]{0,31})/;

export const DEVICE_CODE_TTL_SECONDS = 900;

export interface HytaleDeviceCode {
	code: string;
	url: string;
}

export enum HytaleAuthState {
	SignedIn = "signed-in",
	SignedOut = "signed-out",
	Unknown = "unknown",
}

export interface HytaleAuthReport {
	state: HytaleAuthState;
	mode: string | null;
	lines: string[];
}

export const parseDeviceCode = (lines: string[]): HytaleDeviceCode | null => {
	const groups = lines.join("\n").match(VERIFY_URL)?.groups;

	return groups?.url && groups.code
		? {
				code: groups.code,
				url: groups.url,
			}
		: null;
};

export const parseAuthReport = (lines: string[]): HytaleAuthReport => {
	const output = lines.join("\n");

	return {
		state: SIGNED_OUT.test(output)
			? HytaleAuthState.SignedOut
			: SIGNED_IN.test(output)
				? HytaleAuthState.SignedIn
				: HytaleAuthState.Unknown,
		mode: output.match(MODE)?.groups?.mode?.trim() ?? null,
		lines,
	};
};

export const readAuth = async (context: Bridge.Context): Promise<HytaleAuthReport> => {
	return parseAuthReport(await consoleOutput(context, AUTH_STATUS_COMMAND));
};

export const startDeviceLogin = async (context: Bridge.Context): Promise<HytaleDeviceCode> => {
	await context.command(AUTH_PERSISTENCE_COMMAND);

	const reply = await context.command(AUTH_LOGIN_COMMAND, {
		expect: VERIFY_URL,
		timeoutMs: LOGIN_TIMEOUT_MS,
	});

	const device = parseDeviceCode([
		reply.line ?? "",
	]);

	if (device === null) {
		throw new Error("hytale did not print a device code, open the console tab to read what it answered");
	}

	return device;
};

export const endDeviceLogin = async (context: Bridge.Context) => {
	await context.command(AUTH_LOGOUT_COMMAND);
};
