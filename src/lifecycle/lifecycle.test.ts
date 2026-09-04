import { describe, expect, test } from "bun:test";
import { bootedVersion, heapFor, initialHeapFor, jvmOptions, SERVER_READY, SERVER_STOPPED } from "../shared";
import { bootstrapArguments, serverArguments } from "./lifecycle";

const ESCAPE = String.fromCodePoint(0x1b);

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

describe("jvmOptions", () => {
	test("writes one jvm argument per line, sized from the plan", () => {
		expect(jvmOptions(4096).slice(0, 2)).toEqual([
			"-Xms1638M",
			"-Xmx3276M",
		]);
	});

	test("points the aot cache at the file beside the jar, because start.sh runs java from Server/", () => {
		expect(jvmOptions(4096)).toContain("-XX:AOTCache=HytaleServer.aot");
	});

	test("never emits an argument with a space in it, because start.sh reads the file line by line", () => {
		for (const option of jvmOptions(8192)) {
			expect(option).not.toContain(" ");
			expect(option.startsWith("-")).toBe(true);
		}
	});
});

describe("bootstrapArguments", () => {
	test("runs the installer jar from the volume root", () => {
		expect(bootstrapArguments(4096)).toEqual([
			"java",
			"-Xms1638M",
			"-Xmx3276M",
			"-jar",
			"HytaleServer.jar",
			"--bootstrap",
		]);
	});
});

describe("serverArguments", () => {
	test("runs the official wrapper so exit code 8 is handled inside it", () => {
		expect(serverArguments(5523)).toEqual([
			"bash",
			"start.sh",
			"--bind",
			"0.0.0.0:5523",
			"--auth-mode",
			"authenticated",
		]);
	});

	test("never passes assets or a heap, because start.sh owns both", () => {
		const argv = serverArguments(5520);

		expect(argv).not.toContain("--assets");
		expect(argv.some((argument) => argument.startsWith("-Xmx"))).toBe(false);
	});

	test("leaves sentry on, because the manual only asks for it off during plugin development", () => {
		expect(serverArguments(5520)).not.toContain("--disable-sentry");
		expect(bootstrapArguments(4096)).not.toContain("--disable-sentry");
	});
});

describe("SERVER_READY", () => {
	test("fires on the booted line the server really prints", () => {
		expect(
			SERVER_READY.test(
				"[2026/09/03 22:01:32   INFO]   [HytaleServer]   Hytale Server Booted! [Multiplayer, Fresh Universe] took 972ms",
			),
		).toBe(true);
	});

	test("fires on the same banner in bootstrap mode, where the server binds no port and colours the line", () => {
		expect(
			SERVER_READY.test(
				`${ESCAPE}[m[2026/09/03 22:01:32   INFO]                 [HytaleServer] ${ESCAPE}[0;32m         Hytale Server Booted! [Multiplayer, Fresh Universe] took 972ms 620us 128ns${ESCAPE}[m`,
			),
		).toBe(true);
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
				"[2026/09/03 21:57:07   INFO]   [HytaleServer] Booting up HytaleServer - Version: 0.6.3, Revision: ff802bf5",
			),
		).toBe(false);
	});
});

describe("SERVER_STOPPED", () => {
	test("fires once the server has saved and finished shutting down", () => {
		expect(SERVER_STOPPED.test("[2026/09/03 22:02:50   INFO]   [HytaleServer] Shutdown completed!")).toBe(true);
	});

	test("does not fire on the lines printed while it is still saving", () => {
		expect(SERVER_STOPPED.test("[2026/09/03 22:02:50   INFO]   [HytaleServer] Shutdown triggered!!!")).toBe(false);
		expect(SERVER_STOPPED.test("[2026/09/03 22:02:50   INFO]   [HytaleServer] Shutting down... 0  'null'")).toBe(false);
	});
});

describe("bootedVersion", () => {
	test("reads the version off the boot line", () => {
		expect(
			bootedVersion(
				"[2026/09/03 21:57:07   INFO]   [HytaleServer] Booting up HytaleServer - Version: 0.6.3, Revision: ff802bf5",
			),
		).toBe("0.6.3");
	});

	test("answers null on any other line", () => {
		expect(bootedVersion("Hytale Server Booted!")).toBeNull();
	});
});
