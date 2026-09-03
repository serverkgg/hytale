import { describe, expect, test } from "bun:test";
import { digestUrl, jarUrl, parseMavenDigest, parseMavenMetadata } from "./hytaleMaven";

const METADATA = [
	'<?xml version="1.0" encoding="UTF-8"?>',
	"<metadata>",
	"  <groupId>com.hypixel.hytale</groupId>",
	"  <artifactId>Server</artifactId>",
	"  <versioning>",
	"    <latest>0.6.3</latest>",
	"    <release>0.6.3</release>",
	"    <versions>",
	"      <version>0.5.9</version>",
	"      <version>0.6.0</version>",
	"      <version>0.6.1</version>",
	"      <version>0.6.2</version>",
	"      <version>0.6.3</version>",
	"    </versions>",
	"    <lastUpdated>20260901005922</lastUpdated>",
	"  </versioning>",
	"</metadata>",
].join("\n");

describe("parseMavenMetadata", () => {
	test("reads the release hytale publishes today", () => {
		const metadata = parseMavenMetadata(METADATA);

		expect(metadata.release).toBe("0.6.3");
		expect(metadata.versions).toEqual([
			"0.5.9",
			"0.6.0",
			"0.6.1",
			"0.6.2",
			"0.6.3",
		]);
	});

	test("falls back to latest when maven declares no release", () => {
		expect(parseMavenMetadata(METADATA.replace("<release>0.6.3</release>", "")).release).toBe("0.6.3");
	});

	test("falls back to the last listed version when neither is declared", () => {
		expect(
			parseMavenMetadata(METADATA.replace("<release>0.6.3</release>", "").replace("<latest>0.6.3</latest>", ""))
				.release,
		).toBe("0.6.3");
	});

	test("answers null on a page that is not maven metadata", () => {
		expect(parseMavenMetadata("<!doctype html><html><body>404</body></html>").release).toBeNull();
	});

	test("refuses a version that could escape the url path", () => {
		expect(parseMavenMetadata("<versions><version>../../etc</version></versions>").versions).toEqual([]);
	});
});

describe("parseMavenDigest", () => {
	test("reads the sha1 maven publishes beside the jar", () => {
		expect(parseMavenDigest("28dba5030164f0c6ed86b41100e70292b4b4e23e\n")).toBe(
			"sha1:28dba5030164f0c6ed86b41100e70292b4b4e23e",
		);
	});

	test("answers null when maven answered with a page instead of a checksum", () => {
		expect(parseMavenDigest("<!doctype html><html></html>")).toBeNull();
	});
});

describe("the maven urls", () => {
	test("point at the jar and its checksum for a version", () => {
		expect(jarUrl("0.6.3")).toBe("https://maven.hytale.com/release/com/hypixel/hytale/Server/0.6.3/Server-0.6.3.jar");
		expect(digestUrl("0.6.3")).toBe(
			"https://maven.hytale.com/release/com/hypixel/hytale/Server/0.6.3/Server-0.6.3.jar.sha1",
		);
	});
});
