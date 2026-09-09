import { describe, expect, test } from "bun:test";
import {
	CHAT,
	createPlayerIds,
	IDENTITY_LIMIT,
	identifyRoster,
	PLAYER_DIED,
	PLAYER_JOINED,
	PLAYER_LEFT,
	parseWho,
	rosterPresenceOf,
	rosterUsernameOf,
} from "./hytalePlayers";

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

const joinLine = (display: string, playerId: string) => {
	return `[2026/09/04 02:55:09   INFO]                 [World|default] Player '${display}' joined world 'default' at location (-3.705E+2  1.200E+2  3.555E+2) (${playerId})`;
};

const MESLZY_ID = "beda09a2-23a1-4949-97b4-ad93ed3c78d1";

const SAL_ID = "dd8d4c6b-64e9-4f49-aa45-387f7450f5e2";

describe("createPlayerIds", () => {
	test("learns the uuid behind a display name off the join line", () => {
		const ids = createPlayerIds();

		ids.learn([
			joinLine("Mohammed", MESLZY_ID),
		]);

		expect(ids.idOf("Mohammed")).toBe(MESLZY_ID);
	});

	test("learns the same line when the console wraps it in colour", () => {
		const ids = createPlayerIds();

		ids.learn([
			`${ESCAPE}[m[2026/09/04 02:55:09   INFO]                 [${ESCAPE}[0;32mWorld|default] Player 'Meslzy' joined world 'default' at location (-3.705E+2  1.200E+2  3.555E+2) (${MESLZY_ID})${ESCAPE}[m`,
		]);

		expect(ids.idOf("Meslzy")).toBe(MESLZY_ID);
	});

	test("learns nothing from a line that is not a join", () => {
		const ids = createPlayerIds();

		ids.learn([
			"[2026/01/24 12:51:45   INFO]   [HytaleServer] Booting up HytaleServer - Version: x, Revision: y",
			"[2026/02/06 15:22:45   INFO]   [Universe|P] Removing player 'SalSevenSix' (dd8d4c6b-64e9-4f49-aa45-387f7450f5e2)",
		]);

		expect(ids.idOf("SalSevenSix")).toBeNull();
	});

	test("takes the newest uuid when the same display name joins again", () => {
		const ids = createPlayerIds();

		ids.learn([
			joinLine("Meslzy", SAL_ID),
			joinLine("Meslzy", MESLZY_ID),
		]);

		expect(ids.idOf("Meslzy")).toBe(MESLZY_ID);
	});

	test("keeps a player it learned even after that player left, because the join line scrolls out of the tail", () => {
		const ids = createPlayerIds();

		ids.learn([
			joinLine("Meslzy", MESLZY_ID),
		]);
		ids.learn([
			"[2026/02/06 15:22:45   INFO]   [Universe|P] Removing player 'Meslzy' (beda09a2-23a1-4949-97b4-ad93ed3c78d1)",
		]);

		expect(ids.idOf("Meslzy")).toBe(MESLZY_ID);
	});

	test("drops the oldest name once it has learned more than it keeps", () => {
		const ids = createPlayerIds();

		ids.learn(
			Array.from({
				length: IDENTITY_LIMIT + 1,
			}).map((_, index) => joinLine(`Player${index}`, MESLZY_ID)),
		);

		expect(ids.idOf("Player0")).toBeNull();
		expect(ids.idOf(`Player${IDENTITY_LIMIT}`)).toBe(MESLZY_ID);
	});
});

describe("identifyRoster", () => {
	test("keys a row by the uuid when the join line taught it one", () => {
		const ids = createPlayerIds();

		ids.learn([
			joinLine("Mohammed", MESLZY_ID),
		]);

		expect(
			identifyRoster(
				parseWho([
					"default (1): : Mohammed (meslzy)",
				]),
				ids,
			),
		).toEqual([
			{
				id: MESLZY_ID,
				name: "Mohammed",
				username: "meslzy",
			},
		]);
	});

	test("falls back to the account name for a player who joined before the driver started", () => {
		expect(
			identifyRoster(
				parseWho([
					"default (1): : Mohammed (meslzy)",
				]),
				createPlayerIds(),
			),
		).toEqual([
			{
				id: "meslzy",
				name: "Mohammed",
				username: "meslzy",
			},
		]);
	});

	test("identifies only the players it learned, leaving the rest on their account name", () => {
		const ids = createPlayerIds();

		ids.learn([
			joinLine("Meslzy", MESLZY_ID),
		]);

		expect(
			identifyRoster(
				parseWho([
					"default (2): : Meslzy (Meslzy), SalSevenSix (SalSevenSix)",
				]),
				ids,
			).map((entry) => entry.id),
		).toEqual([
			MESLZY_ID,
			"SalSevenSix",
		]);
	});
});

describe("reading a roster row back after the panel hands it to an action", () => {
	test("takes the account name kick and ban really need", () => {
		expect(
			rosterUsernameOf({
				id: MESLZY_ID,
				name: "Mohammed",
				username: "meslzy",
			}),
		).toBe("meslzy");
	});

	test("falls back to the row id when the row carries no account name", () => {
		expect(
			rosterUsernameOf({
				id: "meslzy",
				name: "Mohammed",
			}),
		).toBe("meslzy");
	});

	test("carries the name, the uuid and the account into the presence payload", () => {
		expect(
			rosterPresenceOf({
				id: MESLZY_ID,
				name: "Mohammed",
				username: "meslzy",
			}),
		).toEqual({
			player: "Mohammed",
			playerId: MESLZY_ID,
			account: "meslzy",
		});
	});

	test("names the player by the row id when the row carries no name", () => {
		expect(
			rosterPresenceOf({
				id: MESLZY_ID,
				username: "meslzy",
			}).player,
		).toBe(MESLZY_ID);
	});
});
