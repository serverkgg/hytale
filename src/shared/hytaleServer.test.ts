import { describe, expect, it } from "bun:test";
import { ASSETS_ARCHIVE, HytaleStage, SERVER_JAR, START_SCRIPT, stageFor } from "./hytaleServer";

describe("stageFor", () => {
	it("stays in bootstrap on an empty volume, where only the installer runs", () => {
		expect(stageFor([])).toBe(HytaleStage.Bootstrap);
	});

	it("stays in bootstrap while the payload is only half extracted", () => {
		expect(
			stageFor([
				SERVER_JAR,
			]),
		).toBe(HytaleStage.Bootstrap);

		expect(
			stageFor([
				SERVER_JAR,
				ASSETS_ARCHIVE,
			]),
		).toBe(HytaleStage.Bootstrap);
	});

	it("moves to the server stage once the official layout is complete", () => {
		expect(
			stageFor([
				SERVER_JAR,
				ASSETS_ARCHIVE,
				START_SCRIPT,
			]),
		).toBe(HytaleStage.Server);
	});

	it("ignores files that are not part of the payload", () => {
		expect(
			stageFor([
				"HytaleServer.jar",
				"auth.key",
				"permissions.json",
			]),
		).toBe(HytaleStage.Bootstrap);
	});
});
