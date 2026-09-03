import { describe, expect, test } from "bun:test";
import { HytaleAuthState, parseAuthReport, parseDeviceCode } from "./hytaleAuth";

describe("parseDeviceCode", () => {
	test("reads the code out of the verification url the server prints", () => {
		expect(
			parseDeviceCode([
				"===================================================================",
				"DEVICE AUTHORIZATION",
				"===================================================================",
				"Visit: https://accounts.hytale.com/device",
				"Enter code: ABCD-1234",
				"Or visit: https://accounts.hytale.com/device?user_code=ABCD-1234",
				"===================================================================",
				"Waiting for authorization (expires in 900 seconds)...",
			]),
		).toEqual({
			code: "ABCD-1234",
			url: "https://accounts.hytale.com/device?user_code=ABCD-1234",
		});
	});

	test("reads the oauth verification url the downloader and the console both print", () => {
		expect(
			parseDeviceCode([
				"Or visit: https://oauth.accounts.hytale.com/oauth2/device/verify?user_code=k9zEVi4p",
			]),
		).toEqual({
			code: "k9zEVi4p",
			url: "https://oauth.accounts.hytale.com/oauth2/device/verify?user_code=k9zEVi4p",
		});
	});

	test("ignores the bare verification url with no code on it", () => {
		expect(
			parseDeviceCode([
				"Visit: https://accounts.hytale.com/device",
				"Starting OAuth2 device flow. Check console for verification URL.",
			]),
		).toBeNull();
	});

	test("answers null when nothing was printed", () => {
		expect(parseDeviceCode([])).toBeNull();
	});
});

describe("parseAuthReport", () => {
	test("reads a signed in server", () => {
		const report = parseAuthReport([
			"=== Server Authentication Status ===",
			"Connection mode: Authenticated (mTLS + JWT)",
			"Mode: OAuth Device",
			"Token: Present",
		]);

		expect(report.state).toBe(HytaleAuthState.SignedIn);
		expect(report.mode).toBe("OAuth Device");
	});

	test("reads a server that never signed in", () => {
		const report = parseAuthReport([
			"=== Server Authentication Status ===",
			"Not authenticated",
			"Use '/auth login browser' or '/auth login device' to authenticate.",
		]);

		expect(report.state).toBe(HytaleAuthState.SignedOut);
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
