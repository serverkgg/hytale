import type { Bridge } from "@serverkgg/bridge";

const TAIL_LINES = 200;

export const SETTLE_MS = 900;

const REPLY_TIMEOUT_MS = 15_000;

const ESCAPE = String.fromCodePoint(0x1b);

const ANSI = new RegExp(`${ESCAPE}\\[[0-9;]*[A-Za-z]`, "g");

const LOG_PREFIX = /^\[\d{4}\/\d{2}\/\d{2}[^\]]*\]\s*(?:\[[^\]]*\]\s*)?/;

export const stripLogPrefix = (line: string) => {
	return line.replaceAll(ANSI, "").replace(LOG_PREFIX, "").trim();
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

export interface ConsoleOptions {
	expect?: RegExp;
	timeoutMs?: number;
	settleMs?: number;
}

export const consoleOutput = async (
	context: Bridge.Context,
	input: string,
	options: ConsoleOptions = {},
): Promise<string[]> => {
	const before = await context.logs.tail(TAIL_LINES);

	if (options.expect === undefined) {
		await context.command(input);
	} else {
		await context
			.command(input, {
				expect: options.expect,
				timeoutMs: options.timeoutMs ?? REPLY_TIMEOUT_MS,
			})
			.catch(() => undefined);
	}

	await Bun.sleep(options.settleMs ?? SETTLE_MS);

	return appendedLines(before, await context.logs.tail(TAIL_LINES))
		.map(stripLogPrefix)
		.filter((line) => line.length > 0);
};
