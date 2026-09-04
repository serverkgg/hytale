import { type Bridge, BridgeUserError } from "@serverkgg/bridge";
import { consoleOutput } from "./hytaleConsole";

export const AUTH_STATUS_COMMAND = "/auth status";

export const AUTH_LOGIN_COMMAND = "/auth login device";

export const AUTH_LOGOUT_COMMAND = "/auth logout";

export const AUTH_CANCEL_COMMAND = "/auth cancel";

export const AUTH_PERSISTENCE_COMMAND = "/auth persistence Encrypted";

export const UPDATE_DOWNLOAD_COMMAND = "/update download";

export const AUTH_SUCCEEDED = /Authentication successful/;

export const VERIFY_URL = /(?<url>https:\/\/\S*device\S*[?&]user_code=(?<code>[A-Za-z0-9][A-Za-z0-9-]{3,31}))/;

export const DEFAULT_DEVICE_CODE_TTL_SECONDS = 900;

const DEVICE_SETTLE_MS = 1200;

const DEVICE_REPLY_TIMEOUT_MS = 45_000;

const STATUS_SETTLE_MS = 400;

const STATUS_REPLY_TIMEOUT_MS = 15_000;

const STATUS_PRINTED = /Certificate:|Token Source:|Not authenticated/;

const DEVICE_PRINTED = /expires in \d{2,5} seconds/i;

const EXPIRES_IN = /expires in (?<seconds>\d{2,5}) seconds/i;

const TOKEN_SOURCE = /^Token Source:\s*(?<source>.*)$/m;

const SESSION_TOKEN = /^Session Token:\s*(?<token>.*)$/m;

const PROFILE = /^Profile:[^\S\n]*(?<profile>.*)$/m;

const PROFILE_ID = /\s*\([^)]*\)\s*$/;

const SUCCESS_MODE = /Authentication successful!\s*Mode:\s*(?<mode>[A-Za-z][A-Za-z0-9 _-]{0,31})/;

const SIGNED_OUT = /\bNot authenticated\b|\bServer logged out\b/i;

const NO_TOKEN = /^(?:Not authenticated|Missing|None|)$/i;

export interface HytaleDeviceCode {
	code: string;
	url: string;
	expiresInSeconds: number;
}

export enum HytaleAuthState {
	SignedIn = "signed-in",
	SignedOut = "signed-out",
	Unknown = "unknown",
}

export interface HytaleAuthReport {
	state: HytaleAuthState;
	mode: string | null;
	profile: string | null;
	lines: string[];
}

export const parseDeviceCode = (lines: string[]): HytaleDeviceCode | null => {
	const output = lines.join("\n");
	const groups = output.match(VERIFY_URL)?.groups;

	if (!groups?.url || !groups.code) {
		return null;
	}

	const seconds = Number(output.match(EXPIRES_IN)?.groups?.seconds ?? Number.NaN);

	return {
		code: groups.code,
		url: groups.url,
		expiresInSeconds: Number.isFinite(seconds) && seconds > 0 ? seconds : DEFAULT_DEVICE_CODE_TTL_SECONDS,
	};
};

const stateOf = (output: string, source: string | null, session: string | null) => {
	if (SUCCESS_MODE.test(output)) {
		return HytaleAuthState.SignedIn;
	}

	if (source !== null) {
		return NO_TOKEN.test(source) || (session !== null && NO_TOKEN.test(session))
			? HytaleAuthState.SignedOut
			: HytaleAuthState.SignedIn;
	}

	return SIGNED_OUT.test(output) ? HytaleAuthState.SignedOut : HytaleAuthState.Unknown;
};

export const parseProfile = (lines: string[]): string | null => {
	const profile = (lines.join("\n").match(PROFILE)?.groups?.profile ?? "").replace(PROFILE_ID, "").trim();

	return profile.length > 0 ? profile : null;
};

export const parseAuthReport = (lines: string[]): HytaleAuthReport => {
	const output = lines.join("\n");
	const source = output.match(TOKEN_SOURCE)?.groups?.source?.trim() ?? null;
	const session = output.match(SESSION_TOKEN)?.groups?.token?.trim() ?? null;
	const state = stateOf(output, source, session);

	return {
		state,
		mode:
			output.match(SUCCESS_MODE)?.groups?.mode?.trim()
			?? (state === HytaleAuthState.SignedIn && source !== null && source.length > 0 ? source : null),
		profile: state === HytaleAuthState.SignedIn ? parseProfile(lines) : null,
		lines,
	};
};

export const readAuth = async (context: Bridge.Context): Promise<HytaleAuthReport> => {
	return parseAuthReport(
		await consoleOutput(context, AUTH_STATUS_COMMAND, {
			expect: STATUS_PRINTED,
			timeoutMs: STATUS_REPLY_TIMEOUT_MS,
			settleMs: STATUS_SETTLE_MS,
		}),
	);
};

export const startDeviceLogin = async (context: Bridge.Context): Promise<HytaleDeviceCode> => {
	await context.command(AUTH_PERSISTENCE_COMMAND);

	const device = parseDeviceCode(
		await consoleOutput(context, AUTH_LOGIN_COMMAND, {
			expect: DEVICE_PRINTED,
			timeoutMs: DEVICE_REPLY_TIMEOUT_MS,
			settleMs: DEVICE_SETTLE_MS,
		}),
	);

	if (device === null) {
		throw new BridgeUserError({
			ar: "هايتيل ما طبع رمز الدخول. افتح تبويب الكونسول عشان تشوف وش رد، وجرّب مرة ثانية.",
			en: "Hytale printed no device code. Open the console tab to read what it answered, then try again.",
		});
	}

	return device;
};

export const endDeviceLogin = async (context: Bridge.Context) => {
	await context.command(AUTH_LOGOUT_COMMAND);
};

export const cancelDeviceLogin = async (context: Bridge.Context) => {
	await context.command(AUTH_CANCEL_COMMAND);
};

export const awaitAuthorization = async (context: Bridge.Context, timeoutMs: number) => {
	return (await context.logs.watch(AUTH_SUCCEEDED, timeoutMs)) !== null;
};

export const downloadPayload = async (context: Bridge.Context) => {
	await context.command(UPDATE_DOWNLOAD_COMMAND);
};
