import type { Bridge } from "@serverkgg/bridge";
import { consoleOutput } from "./hytaleConsole";

export const WHO_COMMAND = "/who";

export const PLAYER_LINE = /^(?<display>[^()]{1,64}?)\s*\((?<username>[A-Za-z0-9_.-]{1,32})\)$/;

export const PLAYER_JOINED =
	/\[World\|[^\]]*\] Player '(?<player>[^']{1,64})' joined world '[^']*'.*\((?<playerId>[^)]*)\)\s*$/;

export const PLAYER_LEFT = /\[Universe[^\]]*\] Removing player '(?<player>[^']{1,64})' \((?<playerId>[^)]*)\)\s*$/;

export const PLAYER_DIED = /\[Gravestones[^\]]*\].*Created for (?<player>\S{1,64}) at \((?<location>[^)]*)\)\s*$/;

export const CHAT = /\[Hytale\] (?<player>[^:]{1,64}): (?<message>.{1,400})$/;

export type HytaleRosterEntry = Bridge.Row & {
	name: string;
	username: string;
};

export const parseWho = (lines: string[]): HytaleRosterEntry[] => {
	const roster: HytaleRosterEntry[] = [];
	const seen = new Set<string>();

	for (const line of lines) {
		const groups = line.match(PLAYER_LINE)?.groups;

		if (!groups?.username || !groups.display || seen.has(groups.username)) {
			continue;
		}

		seen.add(groups.username);

		roster.push({
			id: groups.username,
			name: groups.display.trim(),
			username: groups.username,
		});
	}

	return roster;
};

export const playerRoster = async (context: Bridge.Context): Promise<HytaleRosterEntry[]> => {
	return parseWho(await consoleOutput(context, WHO_COMMAND));
};
