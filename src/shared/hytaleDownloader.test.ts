import { describe, expect, test } from "bun:test";
import { CREDENTIAL_REJECTED, NEEDS_AUTHENTICATION, parsePrintedVersion } from "./hytaleDownloader";

describe("parsePrintedVersion", () => {
	test("reads the version the downloader prints on its own", () => {
		expect(parsePrintedVersion("2026.01.13-50e69c385\n")).toBe("2026.01.13-50e69c385");
	});

	test("takes the last line when the downloader chatted first", () => {
		expect(
			parsePrintedVersion(
				[
					"hytale-downloader is up to date (2026.05.13-99ade04)",
					"2026.01.22-6f8bdbdc4",
					"",
				].join("\n"),
			),
		).toBe("2026.01.22-6f8bdbdc4");
	});

	test("refuses the device login prompt", () => {
		expect(
			parsePrintedVersion(
				[
					"Please visit the following URL to authenticate:",
					"https://oauth.accounts.hytale.com/oauth2/device/verify?user_code=k9zEVi4p",
					"Authorization code: k9zEVi4p",
				].join("\n"),
			),
		).toBeNull();
	});

	test("refuses an error line", () => {
		expect(parsePrintedVersion("error: 404 Not Found\n")).toBeNull();
	});

	test("answers null on empty output", () => {
		expect(parsePrintedVersion("   \n\n")).toBeNull();
	});
});

describe("NEEDS_AUTHENTICATION", () => {
	test("matches the prompt the downloader prints with no credentials", () => {
		expect(NEEDS_AUTHENTICATION.test("Please visit the following URL to authenticate:")).toBe(true);
		expect(NEEDS_AUTHENTICATION.test("https://oauth.accounts.hytale.com/oauth2/device/verify?user_code=k9zEVi4p")).toBe(
			true,
		);
	});

	test("does not match a healthy run", () => {
		expect(NEEDS_AUTHENTICATION.test("2026.01.13-50e69c385")).toBe(false);
	});
});

describe("CREDENTIAL_REJECTED", () => {
	test("matches the invalid_grant the downloader prints on a dead refresh token", () => {
		expect(
			CREDENTIAL_REJECTED.test(
				'error printing version: error fetching server manifest: could not get signed URL for manifest: could not get signed URL: Get "https://account-data.hytale.com/game-assets/version/release.json": oauth2: "invalid_grant" "The provided authorization grant ... The refresh token is malformed or not valid."',
			),
		).toBe(true);
	});

	test("matches a credentials file the downloader could not read", () => {
		expect(
			CREDENTIAL_REJECTED.test(
				"error loading saved session: json: cannot unmarshal string into Go struct field Token.expires_at of type int64",
			),
		).toBe(true);
	});

	test("does not match a healthy run", () => {
		expect(CREDENTIAL_REJECTED.test("2026.01.13-50e69c385")).toBe(false);
		expect(CREDENTIAL_REJECTED.test("hytale-downloader is up to date (2026.05.13-99ade04)")).toBe(false);
	});
});
