import { describe, expect, test } from "bun:test";
import { appendedLines, stripLogPrefix } from "./hytaleConsole";

describe("stripLogPrefix", () => {
	test("drops the timestamp and the component", () => {
		expect(stripLogPrefix("[2026/01/24 12:52:15   INFO]   [ServerManager|P] Listening on /0.0.0.0:5520")).toBe(
			"Listening on /0.0.0.0:5520",
		);
	});

	test("leaves a line the server printed straight to stdout alone", () => {
		expect(stripLogPrefix("Credential storage changed to: Encrypted")).toBe("Credential storage changed to: Encrypted");
	});
});

describe("appendedLines", () => {
	test("returns only what arrived after the command", () => {
		expect(
			appendedLines(
				[
					"a",
					"b",
					"c",
				],
				[
					"a",
					"b",
					"c",
					"d",
					"e",
				],
			),
		).toEqual([
			"d",
			"e",
		]);
	});

	test("handles a tail that has already scrolled", () => {
		expect(
			appendedLines(
				[
					"a",
					"b",
					"c",
					"d",
				],
				[
					"c",
					"d",
					"e",
					"f",
				],
			),
		).toEqual([
			"e",
			"f",
		]);
	});

	test("returns nothing when the console stayed quiet", () => {
		expect(
			appendedLines(
				[
					"a",
					"b",
				],
				[
					"a",
					"b",
				],
			),
		).toEqual([]);
	});

	test("returns everything when nothing lines up", () => {
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
