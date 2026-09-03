import { describe, expect, test } from "bun:test";
import { parseStamp } from "./installStamp";

describe("parseStamp", () => {
	test("reads the version an earlier install wrote", () => {
		expect(parseStamp('{"version":"2026.01.13-50e69c385"}')).toEqual({
			version: "2026.01.13-50e69c385",
		});
	});

	test("refuses a stamp with no version on it", () => {
		expect(parseStamp("{}")).toBeNull();
		expect(parseStamp('{"version":7}')).toBeNull();
	});

	test("refuses a file that is not json, so a half-written stamp forces a reinstall", () => {
		expect(parseStamp("")).toBeNull();
		expect(parseStamp('{"version":')).toBeNull();
	});
});
