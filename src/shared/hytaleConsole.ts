import type { Bridge } from "@serverkgg/bridge";

const TAIL_LINES = 200;

const SETTLE_MS = 900;

const LOG_PREFIX = /^\[\d{4}\/\d{2}\/\d{2}[^\]]*\]\s*(?:\[[^\]]*\]\s*)?/;

export const stripLogPrefix = (line: string) => {
	return line.replace(LOG_PREFIX, "").trim();
};

export const appendedLines = (before: string[], after: string[]) => {
	for (let take = Math.min(before.length, after.length); take > 0; take -= 1) {
		const suffix = before.slice(before.length - take);

		if (suffix.every((line, index) => line === after[index])) {
			return after.slice(take);
		}
	}

	return after;
};

export const consoleOutput = async (context: Bridge.Context, input: string): Promise<string[]> => {
	const before = await context.logs.tail(TAIL_LINES);

	await context.command(input);
	await Bun.sleep(SETTLE_MS);

	return appendedLines(before, await context.logs.tail(TAIL_LINES))
		.map(stripLogPrefix)
		.filter((line) => line.length > 0);
};
