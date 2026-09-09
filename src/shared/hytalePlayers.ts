import type { Bridge } from "@serverkgg/bridge";
import { consoleOutput } from "./hytaleConsole";

export const WHO_COMMAND = "/who";

export const WHO_WORLD = /^\S{1,64}\s*\(\d{1,4}\)\s*:\s*:\s*/;

export const PLAYER_ENTRY = /(?<display>[^(),]{1,64}?)\s*\((?<username>[A-Za-z0-9_.-]{1,32})\)/g;

export const PLAYER_LINE = /^(?<display>[^()]{1,64}?)\s*\((?<username>[A-Za-z0-9_.-]{1,32})\)$/;

export const PLAYER_JOINED =
	/\[[^\]]*World\|[^\]]*\]\s*Player '(?<player>[^']{1,64})' joined world '[^']{0,64}'.*?\((?<playerId>[0-9a-fA-F-]{36})\)/;

export const PLAYER_LEFT =
	/\[[^\]]*Universe[^\]]*\]\s*Removing player '(?<player>[^'(]{1,64}?)'?\s+\((?<playerId>[0-9a-fA-F-]{36})\)/;

export const PLAYER_DIED =
	/\[[^\]]*Gravestones[^\]]*\].*?Created for (?<player>\S{1,64}) at \((?<location>[^)]{1,120})\)/;

export const CHAT = /\[Hytale\] (?<player>[^:]{1,64}): (?<message>.{1,400})$/;

export const IDENTITY_TAIL_LINES = 400;

export const IDENTITY_LIMIT = 200;

export type HytaleRosterEntry = Bridge.Row & {
	name: string;
	username: string;
};

export interface HytalePlayerIds {
	learn(lines: string[]): void;
	idOf(display: string): string | null;
}

export const createPlayerIds = (): HytalePlayerIds => {
	const known = new Map<string, string>();

	return {
		learn(lines) {
			for (const line of lines) {
				const groups = line.match(PLAYER_JOINED)?.groups;
				const display = groups?.player;
				const playerId = groups?.playerId;

				if (!display || !playerId) {
					continue;
				}

				known.delete(display);
				known.set(display, playerId);

				while (known.size > IDENTITY_LIMIT) {
					const oldest = known.keys().next().value;

					if (oldest === undefined) {
						break;
					}

					known.delete(oldest);
				}
			}
		},

		idOf(display) {
			return known.get(display) ?? null;
		},
	};
};

export const playerIds = createPlayerIds();

export const identifyRoster = (roster: HytaleRosterEntry[], ids: HytalePlayerIds): HytaleRosterEntry[] => {
	return roster.map((entry) => {
		const playerId = ids.idOf(entry.name);

		return playerId === null
			? entry
			: {
					...entry,
					id: playerId,
				};
	});
};

export const rosterUsernameOf = (row: Bridge.Row): string => {
	return typeof row.username === "string" && row.username.length > 0 ? row.username : row.id;
};

export const rosterPresenceOf = (row: Bridge.Row): Bridge.Values => {
	return {
		player: typeof row.name === "string" && row.name.length > 0 ? row.name : row.id,
		playerId: row.id,
		account: rosterUsernameOf(row),
	};
};

export const parseWho = (lines: string[]): HytaleRosterEntry[] => {
	const roster: HytaleRosterEntry[] = [];
	const seen = new Set<string>();

	const take = (groups: Record<string, string | undefined> | undefined) => {
		const username = groups?.username;
		const name = groups?.display?.trim();

		if (!username || !name || seen.has(username)) {
			return;
		}

		seen.add(username);

		roster.push({
			id: username,
			name,
			username,
		});
	};

	for (const line of lines) {
		const world = line.match(WHO_WORLD);

		if (world) {
			for (const entry of line.slice(world[0].length).matchAll(PLAYER_ENTRY)) {
				take(entry.groups);
			}

			continue;
		}

		take(line.match(PLAYER_LINE)?.groups);
	}

	return roster;
};

export const playerRoster = async (context: Bridge.Context): Promise<HytaleRosterEntry[]> => {
	playerIds.learn(await context.logs.tail(IDENTITY_TAIL_LINES));

	return identifyRoster(parseWho(await consoleOutput(context, WHO_COMMAND)), playerIds);
};
