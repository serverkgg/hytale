import { describe, expect, test } from "bun:test";
import { appendedLines, stripLogPrefix } from "./hytaleConsole";

const ESCAPE = String.fromCodePoint(0x1b);

const RESET = `${ESCAPE}[m`;

const GREEN = `${ESCAPE}[0;32m`;

describe("stripLogPrefix", () => {
	test("strips the colour hytale wraps every log line in", () => {
		expect(
			stripLogPrefix(
				`${RESET}[2026/09/03 22:02:01   INFO]              [AbstractCommand] Or visit: https://oauth.accounts.hytale.com/oauth2/device/verify?user_code=FnM4EEUw${RESET}`,
			),
		).toBe("Or visit: https://oauth.accounts.hytale.com/oauth2/device/verify?user_code=FnM4EEUw");
	});

	test("strips a colour that starts mid line", () => {
		expect(
			stripLogPrefix(`${RESET}[2026/09/03 22:01:32   INFO]   [HytaleServer] ${GREEN}Hytale Server Booted!${RESET}`),
		).toBe("Hytale Server Booted!");
	});

	test("leaves a command reply, which carries no prefix and no colour, untouched", () => {
		expect(stripLogPrefix("Token Source: Not authenticated")).toBe("Token Source: Not authenticated");
	});
});

describe("appendedLines", () => {
	test("returns only what the console printed after the command", () => {
		expect(
			appendedLines(
				[
					"a",
					"b",
				],
				[
					"a",
					"b",
					"c",
				],
			),
		).toEqual([
			"c",
		]);
	});

	test("returns everything when the tail rolled past what we had", () => {
		expect(
			appendedLines(
				[
					"a",
				],
				[
					"x",
					"y",
				],
			),
		).toEqual([
			"x",
			"y",
		]);
	});
});
