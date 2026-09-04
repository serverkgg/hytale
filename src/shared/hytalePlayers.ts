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

export type HytaleRosterEntry = Bridge.Row & {
	name: string;
	username: string;
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
	return parseWho(await consoleOutput(context, WHO_COMMAND));
};
