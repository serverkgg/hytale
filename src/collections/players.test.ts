import { describe, expect, test } from "bun:test";
import type { Bridge } from "@serverkgg/bridge";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { players } from "./players";

const MESLZY_ID = "beda09a2-23a1-4949-97b4-ad93ed3c78d1";

const JOIN_LINE = `[2026/09/04 02:55:09   INFO]                 [World|default] Player 'Mohammed' joined world 'default' at location (-3.705E+2  1.200E+2  3.555E+2) (${MESLZY_ID})`;

interface Emitted {
	event: string;
	payload: Bridge.Values | undefined;
}

const contextWith = (options: { tails?: string[][]; sent?: string[]; emitted?: Emitted[] }) => {
	const tails = options.tails ?? [];

	let read = 0;

	return {
		command: async (input: string) => {
			options.sent?.push(input);

			return {
				sent: input,
				line: null,
				groups: {},
			};
		},
		logs: {
			tail: async () => {
				const answer = tails.at(read) ?? [];

				read += 1;

				return answer;
			},
		},
		emit: (event: string, payload?: Bridge.Values) => {
			options.emitted?.push({
				event,
				payload,
			});
		},
		log: () => undefined,
	} as unknown as Bridge.Context;
};

describe("listing who is on the server", () => {
	test("keys the row by the uuid the join line carried, not by the account name /who prints", async () => {
		const sent: string[] = [];

		expect(
			await players.list(
				contextWith({
					sent,
					tails: [
						[
							JOIN_LINE,
						],
						[],
						[
							"default (1): : Mohammed (meslzy)",
						],
					],
				}),
			),
		).toEqual([
			{
				id: MESLZY_ID,
				name: "Mohammed",
				username: "meslzy",
			},
		]);

		expect(sent).toEqual([
			"/who",
		]);
	});
});

describe("moderating a player from the roster", () => {
	const row = {
		id: MESLZY_ID,
		name: "Mohammed",
		username: "meslzy",
	};

	test("kicks by the account name, because the console command takes no uuid", async () => {
		const sent: string[] = [];
		const emitted: Emitted[] = [];

		await players.actions?.kick?.(
			contextWith({
				sent,
				emitted,
			}),
			row,
			{},
		);

		expect(sent).toEqual([
			"/kick meslzy",
		]);
		expect(emitted).toEqual([
			{
				event: BridgeEventName.PlayerKicked,
				payload: {
					player: "Mohammed",
					playerId: MESLZY_ID,
					account: "meslzy",
				},
			},
		]);
	});

	test("bans by the account name and carries the same presence payload", async () => {
		const sent: string[] = [];
		const emitted: Emitted[] = [];

		await players.actions?.ban?.(
			contextWith({
				sent,
				emitted,
			}),
			row,
			{},
		);

		expect(sent).toEqual([
			"/ban meslzy",
		]);
		expect(emitted.at(0)?.event).toBe(BridgeEventName.PlayerBanned);
		expect(emitted.at(0)?.payload?.playerId).toBe(MESLZY_ID);
	});
});
