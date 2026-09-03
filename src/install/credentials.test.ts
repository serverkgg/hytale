import { describe, expect, test } from "bun:test";
import { parseCredentials } from "./credentials";

describe("parseCredentials", () => {
	test("accepts the file the downloader writes", () => {
		const raw = JSON.stringify({
			access_token: "at",
			refresh_token: "rt",
			expires_at: 1_767_225_600,
			branch: "release",
		});

		expect(parseCredentials(raw)).toBe(`${JSON.stringify(JSON.parse(raw), null, 2)}\n`);
	});

	test("refuses an empty secret", () => {
		expect(parseCredentials("   ")).toBeNull();
	});

	test("refuses text that is not json", () => {
		expect(parseCredentials("paste it here")).toBeNull();
	});

	test("refuses json that is not an object", () => {
		expect(parseCredentials('["at"]')).toBeNull();
	});

	test("refuses a credentials file with no tokens in it", () => {
		expect(parseCredentials('{"branch":"release"}')).toBeNull();
	});
});
