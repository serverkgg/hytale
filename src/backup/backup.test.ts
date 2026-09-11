import { describe, expect, test } from "bun:test";
import type { Bridge } from "@serverkgg/bridge";
import { PAYLOAD_FILES, SAVE_WORLD_COMMAND, SAVE_WORLD_LINE } from "../shared";
import { backup } from "./backup";

const SAVE_REPLY = "Finished saving all worlds";

interface Harness {
	running?: boolean;
	present?: string[];
	answers?: boolean;
}

const harness = (options: Harness = {}) => {
	const sent: string[] = [];
	const warnings: string[] = [];
	const notes: string[] = [];
	const order: string[] = [];

	let watched: RegExp | null = null;

	const context = {
		server: {
			running: options.running ?? true,
		},
		files: {
			exists: async (path: string) => (options.present ?? PAYLOAD_FILES).includes(path),
		},
		command: async (input: string) => {
			order.push("command");
			sent.push(input);

			return {
				sent: input,
				line: null,
				groups: {},
			};
		},
		logs: {
			watch: async (pattern: RegExp) => {
				order.push("watch");
				watched = pattern;

				return (options.answers ?? true) ? SAVE_REPLY.match(pattern) : null;
			},
		},
		log: Object.assign(
			(message: string) => {
				notes.push(message);
			},
			{
				warn: (message: string) => {
					warnings.push(message);
				},
			},
		),
	} as unknown as Bridge.Context;

	return {
		context,
		sent,
		warnings,
		notes,
		order,
		watched: () => watched,
	};
};

const quiesce = async (harnessed: ReturnType<typeof harness>) => {
	await backup.quiesce?.(harnessed.context);

	return harnessed;
};

describe("reading the line hytale prints when it finishes saving", () => {
	test("matches the reply a real console prints for the save command", () => {
		expect(SAVE_WORLD_LINE.test(SAVE_REPLY)).toBe(true);
	});

	test("ignores the line that only says the save began", () => {
		expect(SAVE_WORLD_LINE.test("Beginning to save all worlds")).toBe(false);
	});
});

describe("holding the world still before the backup", () => {
	test("asks every world to write itself, with the confirmation the command demands", async () => {
		const run = await quiesce(harness());

		expect(run.sent).toEqual([
			SAVE_WORLD_COMMAND,
		]);
	});

	test("waits on the save line the console answers with", async () => {
		const run = await quiesce(harness());

		expect(run.watched()).toBe(SAVE_WORLD_LINE);
		expect(run.notes).toEqual([
			"saved the world before the backup",
		]);
		expect(run.warnings).toEqual([]);
	});

	test("starts watching before it sends the command, so a save that lands at once is not missed", async () => {
		const run = await quiesce(harness());

		expect(run.order).toEqual([
			"watch",
			"command",
		]);
	});

	test("raises when the save never reports, so the point is not labelled clean", async () => {
		const run = harness({
			answers: false,
		});

		await expect(backup.quiesce?.(run.context)).rejects.toThrow(
			"the world did not report itself saved before the backup",
		);
		expect(run.notes).toEqual([]);
	});

	test("sends nothing to a server that is not running", async () => {
		const run = await quiesce(
			harness({
				running: false,
			}),
		);

		expect(run.sent).toEqual([]);
		expect(run.warnings).toEqual([]);
	});

	test("sends nothing while the bootstrap is still fetching the payload, where the save command does not exist yet", async () => {
		const run = await quiesce(
			harness({
				present: [],
			}),
		);

		expect(run.sent).toEqual([]);
		expect(run.warnings).toEqual([]);
	});
});
