import { afterEach, describe, expect, it } from "bun:test";
import { type Bridge, BridgeDetailTone } from "@serverkgg/bridge";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { ACCOUNT_TARGET, stopSetup } from "../setup";
import { AUTH_LOGOUT_COMMAND, HytaleAuthState, HytaleStage } from "../shared";
import { badgesOf, LOGIN_LOGOUT_ACTION, LOGIN_SWITCH_ACTION, login, nextStep } from "./login";

const labels = (stage: HytaleStage, state: HytaleAuthState, profile: string | null = null) => {
	return badgesOf(stage, state, profile).map((badge) => badge.label.en);
};

describe("badgesOf", () => {
	it("names the setup stage while the payload is not there yet", () => {
		expect(labels(HytaleStage.Bootstrap, HytaleAuthState.SignedOut)).toEqual([
			"Setup stage",
			"Not signed in",
		]);
	});

	it("says the game is downloading once a bootstrap server is signed in", () => {
		expect(labels(HytaleStage.Bootstrap, HytaleAuthState.SignedIn)).toEqual([
			"Downloading the game",
			"Signed in",
		]);
	});

	it("says the server is installed once the payload is on disk", () => {
		expect(labels(HytaleStage.Server, HytaleAuthState.SignedIn)).toEqual([
			"Server installed",
			"Signed in",
		]);
	});

	it("names the account the server is signed in with", () => {
		expect(labels(HytaleStage.Server, HytaleAuthState.SignedIn, "Meslzy")).toEqual([
			"Server installed",
			"Signed in as Meslzy",
		]);
	});

	it("names the account in arabic too, without joining the two languages into one sentence", () => {
		const badge = badgesOf(HytaleStage.Server, HytaleAuthState.SignedIn, "Meslzy").at(1);

		expect(badge?.label.ar).toContain("Meslzy");
		expect(badge?.label.ar.replaceAll("Meslzy", "")).not.toMatch(/[A-Za-z]{3}/);
	});

	it("never claims a profile for a server that is not signed in", () => {
		expect(labels(HytaleStage.Bootstrap, HytaleAuthState.SignedOut, "Meslzy")).toEqual([
			"Setup stage",
			"Not signed in",
		]);
	});

	it("says the status is unreadable when the console answered with something else", () => {
		expect(labels(HytaleStage.Bootstrap, HytaleAuthState.Unknown)).toEqual([
			"Setup stage",
			"Couldn't read status",
		]);
	});

	it("keeps the first badge neutral until the server is really installed", () => {
		expect(badgesOf(HytaleStage.Server, HytaleAuthState.SignedIn, null).at(0)?.tone).toBe(BridgeDetailTone.Success);
		expect(badgesOf(HytaleStage.Bootstrap, HytaleAuthState.SignedOut, null).at(0)?.tone).toBe(BridgeDetailTone.Neutral);
	});
});

describe("nextStep", () => {
	it("sends a fresh server to the setup page instead of asking it to press anything here", () => {
		expect(nextStep(HytaleStage.Bootstrap, HytaleAuthState.SignedOut)?.en).toContain("setup page");
	});

	it("tells a signed-in bootstrap server to wait for the download", () => {
		expect(nextStep(HytaleStage.Bootstrap, HytaleAuthState.SignedIn)?.en).toContain("downloading the game files");
	});

	it("has nothing left to say once the server is installed and signed in", () => {
		expect(nextStep(HytaleStage.Server, HytaleAuthState.SignedIn)).toBeNull();
	});

	it("points an installed but signed-out server at the switch button", () => {
		expect(nextStep(HytaleStage.Server, HytaleAuthState.SignedOut)?.en).toContain("Switch account");
	});

	it("never joins the two languages into one sentence", () => {
		const step = nextStep(HytaleStage.Bootstrap, HytaleAuthState.SignedOut);

		expect(step?.ar).not.toMatch(/[A-Za-z]{3}/);
		expect(step?.en).not.toMatch(/\p{Script=Arabic}/u);
	});
});

interface AccountHarness {
	context: Bridge.Context;
	sent: string[];
	reported: Bridge.Activity[];
}

const accountHarness = (): AccountHarness => {
	const sent: string[] = [];
	const reported: Bridge.Activity[] = [];

	const context = {
		files: {
			async exists() {
				return false;
			},
		},

		logs: {
			async tail() {
				return [];
			},

			follow() {
				return () => {
					return;
				};
			},
		},

		async command(input: string) {
			sent.push(input);

			if (input !== AUTH_LOGOUT_COMMAND) {
				await new Promise<void>(() => {
					return;
				});
			}
		},

		setup: {
			report() {
				return;
			},

			clear() {
				return;
			},
		},

		activity: {
			report(entry: Bridge.Activity) {
				reported.push(entry);
			},
		},

		log: Object.assign(
			() => {
				return;
			},
			{
				warn: () => {
					return;
				},
			},
		),
	};

	return {
		context: context as unknown as Bridge.Context,
		sent,
		reported,
	};
};

describe("telling the owner what happened to the account", () => {
	afterEach(() => {
		stopSetup();
	});

	it("says the account was switched and a new sign-in started", async () => {
		const { context, sent, reported } = accountHarness();

		await login.actions?.[LOGIN_SWITCH_ACTION]?.(context, {});

		expect(sent.at(0)).toBe(AUTH_LOGOUT_COMMAND);
		expect(reported).toEqual([
			{
				name: BridgeEventName.SettingsApplied,
				text: {
					ar: "تم تبديل حساب هايتيل، وبدأ تسجيل دخول جديد",
					en: "Switched the Hytale account, a new sign-in started",
				},
				details: {
					target: ACCOUNT_TARGET,
					action: LOGIN_SWITCH_ACTION,
				},
			},
		]);
	});

	it("says the server was signed out", async () => {
		const { context, reported } = accountHarness();

		await login.actions?.[LOGIN_LOGOUT_ACTION]?.(context, {});

		expect(
			reported.map((entry) => [
				entry.name,
				entry.details?.target,
				entry.details?.action,
			]),
		).toEqual([
			[
				BridgeEventName.SettingsApplied,
				ACCOUNT_TARGET,
				LOGIN_LOGOUT_ACTION,
			],
		]);
		expect(reported.at(0)?.text.en).toStartWith("Signed the server out of its Hytale account");
	});
});
