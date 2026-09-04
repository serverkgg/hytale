import { describe, expect, test } from "bun:test";
import { CHAT, PLAYER_DIED, PLAYER_JOINED, PLAYER_LEFT, parseWho } from "./hytalePlayers";

const ESCAPE = String.fromCodePoint(0x1b);

describe("parseWho", () => {
	test("reads the one player off the world line /who really prints", () => {
		expect(
			parseWho([
				"default (1): : Meslzy (Meslzy)",
			]),
		).toEqual([
			{
				id: "Meslzy",
				name: "Meslzy",
				username: "Meslzy",
			},
		]);
	});

	test("never turns the world and its count into a player", () => {
		expect(
			parseWho([
				"default (1): : Meslzy (Meslzy)",
			]).map((entry) => entry.username),
		).not.toContain("1");
	});

	test("answers an empty roster on the world line /who prints when nobody is on", () => {
		expect(
			parseWho([
				"default (0): : (empty)",
			]),
		).toEqual([]);
	});

	test("reads every player off a world line that carries several", () => {
		expect(
			parseWho([
				"default (2): : Meslzy (Meslzy), SalSevenSix (SalSevenSix)",
			]),
		).toEqual([
			{
				id: "Meslzy",
				name: "Meslzy",
				username: "Meslzy",
			},
			{
				id: "SalSevenSix",
				name: "SalSevenSix",
				username: "SalSevenSix",
			},
		]);
	});

	test("reads a display name that differs from the account name", () => {
		expect(
			parseWho([
				"default (1): : Mohammed (meslzy)",
			]),
		).toEqual([
			{
				id: "meslzy",
				name: "Mohammed",
				username: "meslzy",
			},
		]);
	});

	test("gathers the players of every world into one roster", () => {
		expect(
			parseWho([
				"default (1): : Meslzy (Meslzy)",
				"nether (0): : (empty)",
				"arena (1): : SalSevenSix (SalSevenSix)",
			]).map((entry) => entry.username),
		).toEqual([
			"Meslzy",
			"SalSevenSix",
		]);
	});

	test("still reads the one player per line shape", () => {
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

	test("keeps one row per account when a player shows up twice", () => {
		expect(
			parseWho([
				"default (1): : Meslzy (Meslzy)",
				"arena (1): : Meslzy (Meslzy)",
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
	test("PLAYER_JOINED reads the name and the uuid off the line 0.6.3 really prints", () => {
		const groups =
			"[2026/09/04 02:55:09   INFO]                 [World|default] Player 'Meslzy' joined world 'default' at location (-3.705E+2  1.200E+2  3.555E+2) (beda09a2-23a1-4949-97b4-ad93ed3c78d1)".match(
				PLAYER_JOINED,
			)?.groups;

		expect(groups?.player).toBe("Meslzy");
		expect(groups?.playerId).toBe("beda09a2-23a1-4949-97b4-ad93ed3c78d1");
	});

	test("PLAYER_JOINED reads the same line when the console wraps it in colour", () => {
		const groups =
			`${ESCAPE}[m[2026/09/04 02:55:09   INFO]                 [${ESCAPE}[0;32mWorld|default] Player 'Meslzy' joined world 'default' at location (-3.705E+2  1.200E+2  3.555E+2) (beda09a2-23a1-4949-97b4-ad93ed3c78d1)${ESCAPE}[m`.match(
				PLAYER_JOINED,
			)?.groups;

		expect(groups?.player).toBe("Meslzy");
		expect(groups?.playerId).toBe("beda09a2-23a1-4949-97b4-ad93ed3c78d1");
	});

	test("PLAYER_JOINED reads the older location shape", () => {
		const groups =
			"[2026/02/22 15:51:38   INFO]   [World|default] Player 'SalSevenSix' joined world 'default' at location Vector3d{x=-926.6, y=133.4, z=730.1} (dd8d4c6b-64e9-4f49-aa45-387f7450f5e2)".match(
				PLAYER_JOINED,
			)?.groups;

		expect(groups?.player).toBe("SalSevenSix");
		expect(groups?.playerId).toBe("dd8d4c6b-64e9-4f49-aa45-387f7450f5e2");
	});

	test("PLAYER_JOINED ignores the universe line the game prints for the same join, so it is not counted twice", () => {
		expect(
			PLAYER_JOINED.test(
				"[2026/09/04 02:55:09   INFO]                 [Universe|P] Adding player 'Meslzy (beda09a2-23a1-4949-97b4-ad93ed3c78d1)",
			),
		).toBe(false);

		expect(
			PLAYER_LEFT.test(
				"[2026/09/04 02:55:09   INFO]                 [Universe|P] Adding player 'Meslzy (beda09a2-23a1-4949-97b4-ad93ed3c78d1)",
			),
		).toBe(false);
	});

	test("PLAYER_LEFT reads the name and the uuid off the closed quote shape", () => {
		const groups =
			"[2026/02/06 15:22:45   INFO]   [Universe|P] Removing player 'SalSevenSix' (dd8d4c6b-64e9-4f49-aa45-387f7450f5e2)".match(
				PLAYER_LEFT,
			)?.groups;

		expect(groups?.player).toBe("SalSevenSix");
		expect(groups?.playerId).toBe("dd8d4c6b-64e9-4f49-aa45-387f7450f5e2");
	});

	test("PLAYER_LEFT reads the assumed unbalanced quote shape, the one the game uses when it adds a player", () => {
		const groups =
			"[2026/09/04 02:56:41   INFO]                 [Universe|P] Removing player 'Meslzy (beda09a2-23a1-4949-97b4-ad93ed3c78d1)".match(
				PLAYER_LEFT,
			)?.groups;

		expect(groups?.player).toBe("Meslzy");
		expect(groups?.playerId).toBe("beda09a2-23a1-4949-97b4-ad93ed3c78d1");
	});

	test("PLAYER_LEFT reads the assumed coloured line", () => {
		const groups =
			`${ESCAPE}[m[2026/09/04 02:56:41   INFO]                 [${ESCAPE}[0;32mUniverse|P] Removing player 'SalSevenSix' (dd8d4c6b-64e9-4f49-aa45-387f7450f5e2)${ESCAPE}[m`.match(
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

	test("PLAYER_DIED reads the assumed coloured line", () => {
		const groups =
			`${ESCAPE}[m[2026/02/07 07:21:09   INFO]                 [${ESCAPE}[0;32mGravestones|P] [Gravestones] Created for SalSevenSix at (1322, 119, -83)${ESCAPE}[m`.match(
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
