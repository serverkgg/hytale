import { describe, expect, it } from "bun:test";
import type { Bridge } from "@serverkgg/bridge";
import { BRIDGE_ACTIVITY_EXCERPT_LENGTH_LIMIT, BridgeEventName } from "@serverkgg/bridge/protocol";
import { live, WHITELIST_LIST } from "./live";

interface LiveHarness {
	context: Bridge.Context;
	sent: string[];
	reported: Bridge.Activity[];
}

const liveHarness = (): LiveHarness => {
	const sent: string[] = [];
	const reported: Bridge.Activity[] = [];

	const context = {
		async command(input: string) {
			sent.push(input);
		},

		activity: {
			report(entry: Bridge.Activity) {
				reported.push(entry);
			},
		},
	};

	return {
		context: context as unknown as Bridge.Context,
		sent,
		reported,
	};
};

const invoke = async (action: string, args: Bridge.Values) => {
	const harness = liveHarness();

	await live.actions[action]?.(harness.context, args);

	return harness;
};

describe("telling the owner what a live action did", () => {
	it("reports an announcement as an excerpt of the message", async () => {
		const message = "The server restarts in ten minutes for the weekend event, save your builds and log out now please";
		const { reported } = await invoke("announce", {
			message,
		});

		const excerpt = reported.at(0)?.details?.excerpt;

		expect(reported.at(0)?.name).toBe(BridgeEventName.BroadcastSent);
		expect(typeof excerpt === "string" && excerpt.length <= BRIDGE_ACTIVITY_EXCERPT_LENGTH_LIMIT).toBe(true);
		expect(reported.at(0)?.text.en).not.toContain(message);
		expect(reported.at(0)?.text.en).toStartWith('Sent an announcement to players: "The server restarts');
	});

	it("reports the whitelist switch with its new value", async () => {
		const on = await invoke("whitelist", {
			enabled: true,
		});
		const off = await invoke("whitelist", {
			enabled: false,
		});

		expect(on.reported).toEqual([
			{
				name: BridgeEventName.GameplayChanged,
				text: {
					ar: "تم تفعيل القائمة البيضاء",
					en: "Enabled the whitelist",
				},
				details: {
					what: WHITELIST_LIST,
					value: true,
				},
			},
		]);
		expect(off.reported.at(0)?.details?.value).toBe(false);
		expect(off.reported.at(0)?.text.en).toBe("Disabled the whitelist");
	});

	it("names the player added to and removed from the whitelist", async () => {
		const allowed = await invoke("allow", {
			username: " meslzy ",
		});
		const disallowed = await invoke("disallow", {
			username: "meslzy",
		});

		expect(allowed.reported).toEqual([
			{
				name: BridgeEventName.AccessGranted,
				text: {
					ar: "تمت إضافة meslzy إلى القائمة البيضاء",
					en: "Added meslzy to the whitelist",
				},
				subject: "meslzy",
				details: {
					list: WHITELIST_LIST,
				},
			},
		]);
		expect(disallowed.reported.at(0)?.name).toBe(BridgeEventName.AccessRevoked);
		expect(disallowed.reported.at(0)?.subject).toBe("meslzy");
		expect(disallowed.reported.at(0)?.details?.list).toBe(WHITELIST_LIST);
	});

	it("reports nothing when the player name is refused", async () => {
		const { context, sent, reported } = liveHarness();

		await expect(
			live.actions.allow?.(context, {
				username: "not a name",
			}),
		).rejects.toThrow();
		expect(sent).toEqual([]);
		expect(reported).toEqual([]);
	});
});
