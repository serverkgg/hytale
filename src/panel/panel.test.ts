import { describe, expect, test } from "bun:test";
import { type Bridge, BridgeControl, BridgeFormTarget, BridgeLayout, BridgePlace } from "@serverkgg/bridge";
import type { BridgeSection } from "@serverkgg/bridge/protocol";
import { ANNOUNCE_MESSAGE_LENGTH } from "../shared";
import { panel } from "./panel";

const placeOf = (section: BridgeSection | null | undefined) => {
	return section && "place" in section ? section.place : undefined;
};

const sections = panel.tabs.flatMap((tab) => tab.sections);

const fieldsOf = (section: Bridge.Section): Bridge.Field[] => {
	if (section.layout === BridgeLayout.Form) {
		return section.fields;
	}

	if (section.layout === BridgeLayout.Actions || section.layout === BridgeLayout.Detail) {
		return (section.actions ?? []).flatMap((action) => action.fields ?? []);
	}

	return [];
};

const forms = sections.flatMap((section) => {
	return section.layout === BridgeLayout.Form
		? [
				section,
			]
		: [];
});

const details = sections.flatMap((section) => {
	return section.layout === BridgeLayout.Detail
		? [
				section,
			]
		: [];
});

const fields = sections.flatMap(fieldsOf);

const fieldNamed = (key: string) => {
	return fields.find((field) => field.key === key);
};

const manifest = Bun.YAML.parse(await Bun.file(new URL("../../serverk.yml", import.meta.url)).text()) as {
	resources: {
		maxRecommendedPlayers: number;
	};
	container: {
		ports: {
			key: string;
		}[];
	};
};

describe("laying out the hytale panel", () => {
	test("gives every tab a unique id", () => {
		const ids = panel.tabs.map((tab) => tab.id);

		expect(new Set(ids).size).toBe(ids.length);
	});

	test("gives every section a unique id", () => {
		const ids = sections.map((section) => section.id);

		expect(new Set(ids).size).toBe(ids.length);
	});

	test("titles every tab in both arabic and english", () => {
		for (const tab of panel.tabs) {
			expect(tab.title.ar.length).toBeGreaterThan(0);
			expect(tab.title.en.length).toBeGreaterThan(0);
		}
	});

	test("opens on the account tab, because a server that is signed out takes no players", () => {
		expect(panel.tabs.at(0)?.id).toBe("account");
	});

	test("writes the settings form into config.json through the settings module", () => {
		expect(forms.at(0)?.target).toBe(BridgeFormTarget.Settings);
		expect(forms.at(0)?.module).toBe("settings");
	});

	test("tells the player that a settings change needs a restart", () => {
		expect(forms.at(0)?.restartHint).toBe(true);
	});

	test("leaves the first sign-in to the setup page and keeps only the account controls here", () => {
		expect(details.at(0)?.module).toBe("login");
		expect(details.at(0)?.actions?.map((action) => action.id)).toEqual([
			"switch",
			"signout",
		]);
	});

	test("makes the player confirm before throwing the sign-in away", () => {
		const signout = details.at(0)?.actions?.find((action) => action.id === "signout");

		expect(signout?.confirm).toBeDefined();
		expect(signout?.confirmText?.ar.length).toBeGreaterThan(0);
		expect(signout?.confirmText?.en.length).toBeGreaterThan(0);
	});
});

describe("handing the roster and its moderation to the platform players page", () => {
	const rosterTab = panel.tabs.find((tab) => tab.id === "players");
	const rosterTable = sections.find((section) => section.layout === BridgeLayout.Table && section.module === "players");
	const whitelist = sections.find((section) => section.id === "whitelist");

	test("titles the roster tab the way every game titles it", () => {
		expect(rosterTab?.title).toEqual({
			ar: "اللاعبين",
			en: "Players",
		});
	});

	test("places the roster table on the players page instead of a second sidebar entry", () => {
		expect(placeOf(rosterTable)).toBe(BridgePlace.Players);
	});

	test("leaves the roster tab with nothing unplaced, so it drops out of the sidebar", () => {
		expect(rosterTab?.sections.every((section) => placeOf(section) !== undefined)).toBe(true);
	});

	test("keeps the roster tab declared, because a guide still links to it", () => {
		expect(rosterTab).toBeDefined();
	});

	test("offers ban on a player who is not connected, and kick only on one who is", () => {
		const actions = rosterTable?.layout === BridgeLayout.Table ? (rosterTable.actions ?? []) : [];

		expect(actions.find((action) => action.id === "ban")?.offline).toBeUndefined();
		expect(actions.find((action) => action.id === "kick")?.offline).toBeUndefined();
	});

	test("places the whitelist beside the roster rather than in the controls tab", () => {
		expect(placeOf(whitelist)).toBe(BridgePlace.Players);
	});

	test("drives the whitelist through the same live module the quick actions use", () => {
		expect(whitelist?.layout === BridgeLayout.Actions && whitelist.module).toBe("live");
	});

	test("splits the whitelist off so the quick actions section is announce alone", () => {
		const live = sections.find((section) => section.id === "live");

		expect(live?.layout === BridgeLayout.Actions && live.actions.map((action) => action.id)).toEqual([
			"announce",
		]);
	});

	test("carries the whole whitelist, toggle and both edits, into the placed section", () => {
		expect(whitelist?.layout === BridgeLayout.Actions && whitelist.actions.map((action) => action.id)).toEqual([
			"whitelist",
			"allow",
			"disallow",
		]);
	});

	test("keeps the controls tab in the sidebar, because announce is still its own", () => {
		const controls = panel.tabs.find((tab) => tab.id === "controls");

		expect(controls?.sections.some((section) => placeOf(section) === undefined)).toBe(true);
	});

	test("leaves the account detail on its own tab, because a sign-in is not a live metric", () => {
		expect(placeOf(details.at(0))).toBeUndefined();
	});

	test("explains every placed section in one sentence, in both languages", () => {
		for (const section of sections) {
			if (placeOf(section) === undefined) {
				continue;
			}

			if (section.layout === BridgeLayout.Table) {
				continue;
			}

			expect(section.help?.ar.length).toBeGreaterThan(0);
			expect(section.help?.en.length).toBeGreaterThan(0);
		}
	});
});

describe("explaining every form the panel renders", () => {
	test("puts one sentence under every form title, in both languages", () => {
		for (const form of forms) {
			expect(form.help?.ar.length).toBeGreaterThan(0);
			expect(form.help?.en.length).toBeGreaterThan(0);
		}
	});
});

describe("the fields the panel renders for hytale settings", () => {
	test("labels every field in both arabic and english", () => {
		for (const field of fields) {
			expect(field.label.ar.length).toBeGreaterThan(0);
			expect(field.label.en.length).toBeGreaterThan(0);
		}
	});

	test("gives every field a unique key within its form or action, so one setting cannot shadow another", () => {
		const scopes = sections.flatMap((section) => {
			if (section.layout === BridgeLayout.Form) {
				return [
					section.fields,
				];
			}

			if (section.layout === BridgeLayout.Actions || section.layout === BridgeLayout.Detail) {
				return (section.actions ?? []).map((action) => action.fields ?? []);
			}

			return [];
		});

		for (const scope of scopes) {
			const keys = scope.map((field) => field.key);

			expect(new Set(keys).size).toBe(keys.length);
		}
	});

	test("keeps every range the right way round", () => {
		for (const field of fields) {
			if (field.min !== undefined && field.max !== undefined) {
				expect(field.max).toBeGreaterThan(field.min);
			}
		}
	});

	test("only bounds fields that carry a number", () => {
		for (const field of fields) {
			if (field.min !== undefined || field.max !== undefined || field.step !== undefined) {
				expect([
					BridgeControl.Number,
					BridgeControl.Slider,
				]).toContain(field.control);
			}
		}
	});

	test("keeps every text limit positive", () => {
		for (const field of fields) {
			if (field.maxLength !== undefined) {
				expect(field.maxLength).toBeGreaterThan(0);
			}
		}
	});

	test("never lets the player set a server with no room in it", () => {
		expect(fieldNamed("MaxPlayers")?.min).toBe(1);
		expect(fieldNamed("MaxPlayers")?.max).toBeGreaterThanOrEqual(manifest.resources.maxRecommendedPlayers);
	});

	test("bounds the view distance to the range hytale itself accepts, because it is what drives memory", () => {
		expect(fieldNamed("MaxViewRadius")?.min).toBe(1);
		expect(fieldNamed("MaxViewRadius")?.max).toBe(32);
	});

	test("advertises the same announce limit the driver enforces", () => {
		expect(fieldNamed("message")?.maxLength).toBe(ANNOUNCE_MESSAGE_LENGTH);
	});

	test("only edits keys config.json holds at its top level, which is all the json codec can merge", () => {
		expect(forms.at(0)?.fields.map((field) => field.key)).toEqual([
			"ServerName",
			"MOTD",
			"Password",
			"MaxPlayers",
			"MaxViewRadius",
		]);
	});
});
