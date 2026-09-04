import { describe, expect, test } from "bun:test";
import { BridgeDetailTone } from "@serverkgg/bridge";
import { HytaleAuthState, HytaleStage } from "../shared";
import { badgesOf, nextStep } from "./login";

const labels = (stage: HytaleStage, state: HytaleAuthState, waiting: boolean) => {
	return badgesOf(stage, state, waiting).map((badge) => badge.label.en);
};

describe("badgesOf", () => {
	test("names the setup stage while the payload is not there yet", () => {
		expect(labels(HytaleStage.Bootstrap, HytaleAuthState.SignedOut, false)).toEqual([
			"Setup stage",
			"Not signed in",
		]);
	});

	test("says the game is downloading once a bootstrap server is signed in", () => {
		expect(labels(HytaleStage.Bootstrap, HytaleAuthState.SignedIn, false)).toEqual([
			"Downloading the game",
			"Signed in",
		]);
	});

	test("says the server is installed once the payload is on disk", () => {
		expect(labels(HytaleStage.Server, HytaleAuthState.SignedIn, false)).toEqual([
			"Server installed",
			"Signed in",
		]);
	});

	test("shows the waiting badge alone while a code is out, never an unreadable status", () => {
		expect(labels(HytaleStage.Bootstrap, HytaleAuthState.Unknown, true)).toEqual([
			"Setup stage",
			"Waiting for you",
		]);
	});

	test("keeps the first badge neutral until the server is really installed", () => {
		expect(badgesOf(HytaleStage.Server, HytaleAuthState.SignedIn, false).at(0)?.tone).toBe(BridgeDetailTone.Success);
		expect(badgesOf(HytaleStage.Bootstrap, HytaleAuthState.SignedOut, false).at(0)?.tone).toBe(
			BridgeDetailTone.Neutral,
		);
	});
});

describe("nextStep", () => {
	test("tells a fresh server to sign in", () => {
		expect(nextStep(HytaleStage.Bootstrap, HytaleAuthState.SignedOut, false)?.en).toContain("Press Start login");
	});

	test("tells a waiting server to open the link", () => {
		expect(nextStep(HytaleStage.Bootstrap, HytaleAuthState.SignedOut, true)?.en).toContain("Open the link below");
	});

	test("tells a signed-in bootstrap server to wait for the download", () => {
		expect(nextStep(HytaleStage.Bootstrap, HytaleAuthState.SignedIn, false)?.en).toContain(
			"downloading the game files",
		);
	});

	test("has nothing left to say once the server is installed and signed in", () => {
		expect(nextStep(HytaleStage.Server, HytaleAuthState.SignedIn, false)).toBeNull();
	});

	test("tells an installed but signed-out server to sign back in", () => {
		expect(nextStep(HytaleStage.Server, HytaleAuthState.SignedOut, false)?.en).toContain("installed but signed out");
	});

	test("never joins the two languages into one sentence", () => {
		const step = nextStep(HytaleStage.Bootstrap, HytaleAuthState.SignedOut, false);

		expect(step?.ar).not.toMatch(/[A-Za-z]{3}/);
		expect(step?.en).not.toMatch(/\p{Script=Arabic}/u);
	});
});
