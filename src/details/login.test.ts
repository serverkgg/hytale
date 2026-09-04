import { describe, expect, test } from "bun:test";
import { BridgeDetailTone } from "@serverkgg/bridge";
import { HytaleAuthState, HytaleStage } from "../shared";
import { badgesOf, nextStep } from "./login";

const labels = (stage: HytaleStage, state: HytaleAuthState, profile: string | null = null) => {
	return badgesOf(stage, state, profile).map((badge) => badge.label.en);
};

describe("badgesOf", () => {
	test("names the setup stage while the payload is not there yet", () => {
		expect(labels(HytaleStage.Bootstrap, HytaleAuthState.SignedOut)).toEqual([
			"Setup stage",
			"Not signed in",
		]);
	});

	test("says the game is downloading once a bootstrap server is signed in", () => {
		expect(labels(HytaleStage.Bootstrap, HytaleAuthState.SignedIn)).toEqual([
			"Downloading the game",
			"Signed in",
		]);
	});

	test("says the server is installed once the payload is on disk", () => {
		expect(labels(HytaleStage.Server, HytaleAuthState.SignedIn)).toEqual([
			"Server installed",
			"Signed in",
		]);
	});

	test("names the account the server is signed in with", () => {
		expect(labels(HytaleStage.Server, HytaleAuthState.SignedIn, "Meslzy")).toEqual([
			"Server installed",
			"Signed in as Meslzy",
		]);
	});

	test("names the account in arabic too, without joining the two languages into one sentence", () => {
		const badge = badgesOf(HytaleStage.Server, HytaleAuthState.SignedIn, "Meslzy").at(1);

		expect(badge?.label.ar).toContain("Meslzy");
		expect(badge?.label.ar.replaceAll("Meslzy", "")).not.toMatch(/[A-Za-z]{3}/);
	});

	test("never claims a profile for a server that is not signed in", () => {
		expect(labels(HytaleStage.Bootstrap, HytaleAuthState.SignedOut, "Meslzy")).toEqual([
			"Setup stage",
			"Not signed in",
		]);
	});

	test("says the status is unreadable when the console answered with something else", () => {
		expect(labels(HytaleStage.Bootstrap, HytaleAuthState.Unknown)).toEqual([
			"Setup stage",
			"Status unreadable",
		]);
	});

	test("keeps the first badge neutral until the server is really installed", () => {
		expect(badgesOf(HytaleStage.Server, HytaleAuthState.SignedIn, null).at(0)?.tone).toBe(BridgeDetailTone.Success);
		expect(badgesOf(HytaleStage.Bootstrap, HytaleAuthState.SignedOut, null).at(0)?.tone).toBe(BridgeDetailTone.Neutral);
	});
});

describe("nextStep", () => {
	test("sends a fresh server to the setup page instead of asking it to press anything here", () => {
		expect(nextStep(HytaleStage.Bootstrap, HytaleAuthState.SignedOut)?.en).toContain("setup page");
	});

	test("tells a signed-in bootstrap server to wait for the download", () => {
		expect(nextStep(HytaleStage.Bootstrap, HytaleAuthState.SignedIn)?.en).toContain("downloading the game files");
	});

	test("has nothing left to say once the server is installed and signed in", () => {
		expect(nextStep(HytaleStage.Server, HytaleAuthState.SignedIn)).toBeNull();
	});

	test("points an installed but signed-out server at the switch button", () => {
		expect(nextStep(HytaleStage.Server, HytaleAuthState.SignedOut)?.en).toContain("Switch account");
	});

	test("never joins the two languages into one sentence", () => {
		const step = nextStep(HytaleStage.Bootstrap, HytaleAuthState.SignedOut);

		expect(step?.ar).not.toMatch(/[A-Za-z]{3}/);
		expect(step?.en).not.toMatch(/\p{Script=Arabic}/u);
	});
});
