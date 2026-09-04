import { describe, expect, test } from "bun:test";
import { MODS_SIDECAR, type ModEntry, parseSidecar, serializeSidecar, sidecarPath } from "./modsSidecar";

const entry: ModEntry = {
	id: "918273",
	provider: "curseforge",
	projectId: "918273",
	fileId: "5544332",
	title: "HeroCore API",
	version: "HeroCore-1.4.2.jar",
	gameVersion: "0.6",
	gameVersions: [
		"0.6",
	],
	installedFor: "0.6.3",
	fileName: "HeroCore-1.4.2.jar",
	pageUrl: "https://www.curseforge.com/hytale/mods/herocore-api",
	icon: null,
	sizeBytes: 2048,
};

describe("where the record of what the catalog installed lives", () => {
	test("the sidecar sits inside the mods folder it describes", () => {
		expect(sidecarPath("Server/mods")).toBe(`Server/mods/${MODS_SIDECAR}`);
	});
});

describe("reading and writing the mods sidecar", () => {
	test("a written sidecar reads back exactly as it went in", () => {
		const written = {
			[entry.fileName]: entry,
		};

		expect(parseSidecar(serializeSidecar(written))).toEqual(written);
	});

	test("an entry written before we recorded the versions reads back without them", () => {
		const older = parseSidecar(
			'{"HeroCore-1.4.2.jar":{"id":"918273","provider":"curseforge","projectId":"918273","fileId":"5544332","title":"HeroCore API","version":"HeroCore-1.4.2.jar","gameVersion":"0.6.3","fileName":"HeroCore-1.4.2.jar","pageUrl":null,"icon":null,"sizeBytes":2048}}',
		)[entry.fileName];

		expect(older?.gameVersion).toBe("0.6.3");
		expect(older?.gameVersions).toBeUndefined();
		expect(older?.installedFor).toBeUndefined();
	});

	test("a file holding anything but an object reads as empty", () => {
		expect(parseSidecar("[]")).toEqual({});
		expect(parseSidecar("null")).toEqual({});
		expect(parseSidecar('"HeroCore"')).toEqual({});
	});

	test("a truncated or empty file reads as empty instead of throwing", () => {
		expect(parseSidecar("")).toEqual({});
		expect(parseSidecar('{"HeroCore-1.4.2.jar":')).toEqual({});
	});
});
