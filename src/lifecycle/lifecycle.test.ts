import { describe, expect, test } from "bun:test";
import { bootedVersion, SERVER_READY } from "../shared";
import { heapFor, initialHeapFor } from "./heap";
import { launchArguments } from "./lifecycle";

describe("heapFor", () => {
	test("leaves headroom for the jvm itself", () => {
		expect(heapFor(4096)).toBe(3276);
		expect(heapFor(8192)).toBe(6553);
	});

	test("never hands the heap more than the plan minus headroom", () => {
		expect(heapFor(2048)).toBe(1536);
	});

	test("refuses a plan hytale cannot run on", () => {
		expect(() => heapFor(1024)).toThrow();
	});

	test("starts the heap at half of its ceiling", () => {
		expect(initialHeapFor(3276)).toBe(1638);
	});
});

describe("launchArguments", () => {
	test("binds the manifest port and runs authenticated", () => {
		expect(
			launchArguments({
				aot: true,
				heapMb: 3276,
				port: 5523,
			}),
		).toEqual([
			"java",
			"-Xms1638M",
			"-Xmx3276M",
			"-XX:AOTCache=Server/HytaleServer.aot",
			"-jar",
			"Server/HytaleServer.jar",
			"--assets",
			"Assets.zip",
			"--bind",
			"0.0.0.0:5523",
			"--auth-mode",
			"authenticated",
		]);
	});

	test("drops the aot cache when the payload did not ship one", () => {
		expect(
			launchArguments({
				aot: false,
				heapMb: 3276,
				port: 5520,
			}),
		).not.toContain("-XX:AOTCache=Server/HytaleServer.aot");
	});
});

describe("SERVER_READY", () => {
	test("fires on the booted line", () => {
		expect(SERVER_READY.test("[2026/01/24 12:52:15   INFO]   [HytaleServer] Hytale Server Booted!")).toBe(true);
	});

	test("fires on the listening line", () => {
		expect(
			SERVER_READY.test(
				"[2026/01/24 12:52:15   INFO]   [ServerManager|P] Listening on /0.0.0.0:5520 and took 9ms 693us 147ns",
			),
		).toBe(true);
	});

	test("does not fire while it is still booting", () => {
		expect(
			SERVER_READY.test(
				"[2026/01/24 12:51:45   INFO]   [HytaleServer] Booting up HytaleServer - Version: 2026.01.17-4b0f30090, Revision: 4b0f3",
			),
		).toBe(false);
	});
});

describe("bootedVersion", () => {
	test("reads the version off the boot line", () => {
		expect(
			bootedVersion(
				"[2026/01/24 12:51:45   INFO]   [HytaleServer] Booting up HytaleServer - Version: 2026.01.17-4b0f30090, Revision: 4b0f3",
			),
		).toBe("2026.01.17-4b0f30090");
	});

	test("answers null on any other line", () => {
		expect(bootedVersion("Hytale Server Booted!")).toBeNull();
	});
});
