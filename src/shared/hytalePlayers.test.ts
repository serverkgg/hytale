import { describe, expect, test } from "bun:test";
import { CHAT, PLAYER_DIED, PLAYER_JOINED, PLAYER_LEFT, parseWho } from "./hytalePlayers";

describe("parseWho", () => {
	test("reads the display name and the account name off every player line", () => {
		expect(
			parseWho([
				"SalSevenSix (SalSevenSix)",
				"Mohammed (meslzy)",
			]),
		).toEqual([
			{
				id: "SalSevenSix",
				name: "SalSevenSix",
				username: "SalSevenSix",
			},
			{
				id: "meslzy",
				name: "Mohammed",
				username: "meslzy",
			},
		]);
	});

	test("skips the lines around the roster", () => {
		expect(
			parseWho([
				"Players online:",
				"Mohammed (meslzy)",
				"Backup completed!",
			]),
		).toEqual([
			{
				id: "meslzy",
				name: "Mohammed",
				username: "meslzy",
			},
		]);
	});

	test("keeps one row per account when a line repeats", () => {
		expect(
			parseWho([
				"Mohammed (meslzy)",
				"Mohammed (meslzy)",
			]),
		).toHaveLength(1);
	});

	test("answers an empty roster when nobody is on", () => {
		expect(parseWho([])).toEqual([]);
		expect(
			parseWho([
				"Invalid value 'x' for --real argument. Expected: 'real'",
			]),
		).toEqual([]);
	});
});

describe("log patterns", () => {
	test("PLAYER_JOINED reads the name and the uuid", () => {
		const groups =
			"[2026/02/22 15:51:38   INFO]   [World|default] Player 'SalSevenSix' joined world 'default' at location Vector3d{x=-926.6, y=133.4, z=730.1} (dd8d4c6b-64e9-4f49-aa45-387f7450f5e2)".match(
				PLAYER_JOINED,
			)?.groups;

		expect(groups?.player).toBe("SalSevenSix");
		expect(groups?.playerId).toBe("dd8d4c6b-64e9-4f49-aa45-387f7450f5e2");
	});

	test("PLAYER_LEFT reads the name and the uuid", () => {
		const groups =
			"[2026/02/06 15:22:45   INFO]   [Universe|P] Removing player 'SalSevenSix' (dd8d4c6b-64e9-4f49-aa45-387f7450f5e2)".match(
				PLAYER_LEFT,
			)?.groups;

		expect(groups?.player).toBe("SalSevenSix");
		expect(groups?.playerId).toBe("dd8d4c6b-64e9-4f49-aa45-387f7450f5e2");
	});

	test("PLAYER_DIED reads the name and where it happened", () => {
		const groups =
			"[2026/02/07 07:21:09   INFO]   [Gravestones|P] [Gravestones] Created for SalSevenSix at (1322, 119, -83)".match(
				PLAYER_DIED,
			)?.groups;

		expect(groups?.player).toBe("SalSevenSix");
		expect(groups?.location).toBe("1322, 119, -83");
	});

	test("CHAT reads who said what", () => {
		const groups = "[2026/01/24 08:55:01   INFO]   [Hytale] SalSevenSix: Hello everyone".match(CHAT)?.groups;

		expect(groups?.player).toBe("SalSevenSix");
		expect(groups?.message).toBe("Hello everyone");
	});

	test("a booting line is not a player event", () => {
		const line = "[2026/01/24 12:51:45   INFO]   [HytaleServer] Booting up HytaleServer - Version: x, Revision: y";

		expect(PLAYER_JOINED.test(line)).toBe(false);
		expect(PLAYER_LEFT.test(line)).toBe(false);
	});
});
