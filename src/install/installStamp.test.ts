import { describe, expect, test } from "bun:test";
import type { Bridge } from "@serverkgg/bridge";
import { INSTALL_STAMP_FILE } from "@serverkgg/bridge/install";
import { installStampOf, readInstallStamp, stampVersion } from "./installStamp";

describe("installStampOf", () => {
	test("reads the installer an earlier boot placed", () => {
		expect(
			installStampOf({
				installer: "0.6.3",
				version: null,
			}),
		).toEqual({
			installer: "0.6.3",
			version: null,
		});
	});

	test("reads the payload version a later boot observed", () => {
		expect(
			installStampOf({
				installer: "0.6.3",
				version: "0.6.4",
			}),
		).toEqual({
			installer: "0.6.3",
			version: "0.6.4",
		});
	});

	test("refuses a stamp with no installer on it, so the installer is fetched again", () => {
		expect(installStampOf({})).toBeNull();
		expect(
			installStampOf({
				installer: 7,
			}),
		).toBeNull();
		expect(
			installStampOf({
				installer: "",
			}),
		).toBeNull();
		expect(
			installStampOf({
				version: "0.6.3",
			}),
		).toBeNull();
	});

	test("refuses an unreadable stamp, so a half-written file forces a reinstall", () => {
		expect(installStampOf(null)).toBeNull();
	});

	test("drops a version that is not usable text", () => {
		expect(
			installStampOf({
				installer: "0.6.3",
				version: 7,
			}),
		).toEqual({
			installer: "0.6.3",
			version: null,
		});
	});
});

const stampContext = (seed: Record<string, string> = {}) => {
	const stored = new Map(Object.entries(seed));

	return {
		context: {
			files: {
				async exists(path: string) {
					return stored.has(path);
				},
				async read(path: string) {
					return stored.get(path) ?? "";
				},
				async write(path: string, content: string) {
					stored.set(path, content);
				},
			},
		} as unknown as Bridge.Context,
	};
};

describe("stampVersion", () => {
	test("answers true and keeps the installer when the version changed", async () => {
		const { context } = stampContext({
			[INSTALL_STAMP_FILE]: JSON.stringify({
				installer: "0.6.3",
				version: "0.6.3",
			}),
		});

		expect(await stampVersion(context, "0.6.4")).toBe(true);
		expect(await readInstallStamp(context)).toEqual({
			installer: "0.6.3",
			version: "0.6.4",
		});
	});

	test("answers false when the booted version is already stamped", async () => {
		const { context } = stampContext({
			[INSTALL_STAMP_FILE]: JSON.stringify({
				installer: "0.6.3",
				version: "0.6.3",
			}),
		});

		expect(await stampVersion(context, "0.6.3")).toBe(false);
	});

	test("answers true on the first boot and stamps the version as the installer", async () => {
		const { context } = stampContext();

		expect(await stampVersion(context, "0.6.3")).toBe(true);
		expect(await readInstallStamp(context)).toEqual({
			installer: "0.6.3",
			version: "0.6.3",
		});
	});
});
