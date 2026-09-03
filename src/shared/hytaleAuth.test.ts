import { describe, expect, test } from "bun:test";
import { DEFAULT_DEVICE_CODE_TTL_SECONDS, HytaleAuthState, parseAuthReport, parseDeviceCode } from "./hytaleAuth";

const DEVICE_BLOCK = [
	"Starting OAuth2 device flow. Check console for verification URL.",
	"===================================================================",
	"DEVICE AUTHORIZATION",
	"===================================================================",
	"Visit: https://oauth.accounts.hytale.com/oauth2/device/verify",
	"Enter code: FnM4EEUw",
	"Or visit: https://oauth.accounts.hytale.com/oauth2/device/verify?user_code=FnM4EEUw",
	"===================================================================",
	"Waiting for authorization (expires in 599 seconds)...",
];

const SIGNED_OUT_STATUS = [
	"=== Server Authentication Status ===",
	"Connection Auth: Authenticated (mTLS + JWT)",
	"Token Source: Not authenticated",
	"Profile: ",
	"Session Token: Missing",
	"Identity Token: Missing",
	"Expiry: ",
	"Certificate: Not loaded",
	"Use '/auth login browser' or '/auth login device' to authenticate.",
];

describe("parseDeviceCode", () => {
	test("reads the code, the link and the expiry out of the block the server prints", () => {
		expect(parseDeviceCode(DEVICE_BLOCK)).toEqual({
			code: "FnM4EEUw",
			url: "https://oauth.accounts.hytale.com/oauth2/device/verify?user_code=FnM4EEUw",
			expiresInSeconds: 599,
		});
	});

	test("falls back to the documented ttl when the waiting line scrolled past", () => {
		expect(
			parseDeviceCode([
				"Or visit: https://accounts.hytale.com/device?user_code=ABCD-1234",
			]),
		).toEqual({
			code: "ABCD-1234",
			url: "https://accounts.hytale.com/device?user_code=ABCD-1234",
			expiresInSeconds: DEFAULT_DEVICE_CODE_TTL_SECONDS,
		});
	});

	test("ignores the bare verification url with no code on it", () => {
		expect(
			parseDeviceCode([
				"Visit: https://oauth.accounts.hytale.com/oauth2/device/verify",
				"Starting OAuth2 device flow. Check console for verification URL.",
			]),
		).toBeNull();
	});

	test("answers null when nothing was printed", () => {
		expect(parseDeviceCode([])).toBeNull();
	});
});

describe("parseAuthReport", () => {
	test("reads a server that never signed in, even though the line above says Authenticated", () => {
		const report = parseAuthReport(SIGNED_OUT_STATUS);

		expect(report.state).toBe(HytaleAuthState.SignedOut);
		expect(report.mode).toBeNull();
	});

	test("reads a signed in server off its token source", () => {
		const report = parseAuthReport([
			"=== Server Authentication Status ===",
			"Connection Auth: Authenticated (mTLS + JWT)",
			"Token Source: OAuth Device",
			"Profile: meslzy",
			"Session Token: Present",
			"Identity Token: Present",
			"Certificate: Loaded",
		]);

		expect(report.state).toBe(HytaleAuthState.SignedIn);
		expect(report.mode).toBe("OAuth Device");
	});

	test("reads a server whose token source survived but whose session token did not", () => {
		expect(
			parseAuthReport([
				"Token Source: OAuth Device",
				"Session Token: Missing",
			]).state,
		).toBe(HytaleAuthState.SignedOut);
	});

	test("reads a server that just logged out", () => {
		expect(
			parseAuthReport([
				"Server logged out. Previous mode: OAUTH_STORE",
			]).state,
		).toBe(HytaleAuthState.SignedOut);
	});

	test("reads the success line the login prints", () => {
		expect(
			parseAuthReport([
				"Authentication successful! Mode: OAUTH_DEVICE",
			]),
		).toEqual({
			state: HytaleAuthState.SignedIn,
			mode: "OAUTH_DEVICE",
			lines: [
				"Authentication successful! Mode: OAUTH_DEVICE",
			],
		});
	});

	test("stays unknown when the console said something we do not recognise", () => {
		expect(
			parseAuthReport([
				"something else entirely",
			]).state,
		).toBe(HytaleAuthState.Unknown);
	});
});
