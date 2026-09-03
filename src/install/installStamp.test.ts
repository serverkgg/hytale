import { describe, expect, test } from "bun:test";
import { parseStamp } from "./installStamp";

describe("parseStamp", () => {
	test("reads the installer an earlier boot placed", () => {
		expect(parseStamp('{"installer":"0.6.3","version":null}')).toEqual({
			installer: "0.6.3",
			version: null,
		});
	});

	test("reads the payload version a later boot observed", () => {
		expect(parseStamp('{"installer":"0.6.3","version":"0.6.4"}')).toEqual({
			installer: "0.6.3",
			version: "0.6.4",
		});
	});

	test("refuses a stamp with no installer on it, so the installer is fetched again", () => {
		expect(parseStamp("{}")).toBeNull();
		expect(parseStamp('{"installer":7}')).toBeNull();
		expect(parseStamp('{"version":"0.6.3"}')).toBeNull();
	});

	test("refuses a file that is not json, so a half-written stamp forces a reinstall", () => {
		expect(parseStamp("")).toBeNull();
		expect(parseStamp('{"installer":')).toBeNull();
	});
});
