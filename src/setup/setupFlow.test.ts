import { describe, expect, test } from "bun:test";
import { BridgeSetupPromptKind, BridgeSetupStepState } from "@serverkgg/bridge";
import { HytaleAuthState, HytaleStage } from "../shared";
import {
	DOWNLOAD_COMPLETE,
	DOWNLOAD_PROGRESS,
	exhausted,
	HytaleSetupPhase,
	progressFrom,
	RENEW_LIMIT,
	runtimeOf,
	signedInAt,
	startingRuntime,
} from "./setupFlow";

const DEVICE = {
	code: "FnM4EEUw",
	url: "https://oauth.accounts.hytale.com/oauth2/device/verify?user_code=FnM4EEUw",
	expiresInSeconds: 599,
};

const EXPIRES_AT = Date.parse("2026-09-04T10:00:00.000Z");

const PROGRESS_LINE = "[2026/09/04 09:58:11   INFO]   [Bootstrap] Download progress: 10% (146.6 MiB / 1.4 GiB)";

const COMPLETE_LINE = "[2026/09/04 10:05:44   INFO]   [Bootstrap] Bootstrap install complete";

const statesOf = (state: Parameters<typeof runtimeOf>[0]) => {
	return runtimeOf(state).steps.map((step) => `${step.id}:${step.state}`);
};

const progressOf = (line: string) => {
	const match = line.match(DOWNLOAD_PROGRESS);

	if (match === null) {
		throw new Error(`no download progress on "${line}"`);
	}

	return progressFrom(match);
};

describe("reading the console lines the bootstrap prints", () => {
	test("reads the percent and the sizes off a real download line", () => {
		expect(progressOf(PROGRESS_LINE)).toEqual({
			percent: 10,
			detail: "146.6 MiB / 1.4 GiB",
		});
	});

	test("fires on the line that says the payload is installed", () => {
		expect(DOWNLOAD_COMPLETE.test(COMPLETE_LINE)).toBe(true);
		expect(DOWNLOAD_COMPLETE.test(PROGRESS_LINE)).toBe(false);
	});

	test("keeps the bar inside its range and drops an empty detail", () => {
		expect(progressOf("Download progress: 120% (   )")).toEqual({
			percent: 100,
			detail: null,
		});
	});
});

describe("the runtime the driver reports for each phase", () => {
	test("waits on the server while it boots, with the sign-in already active", () => {
		expect(startingRuntime()).toEqual(
			runtimeOf({
				phase: HytaleSetupPhase.Starting,
			}),
		);

		expect(
			statesOf({
				phase: HytaleSetupPhase.Starting,
			}),
		).toEqual([
			`sign-in:${BridgeSetupStepState.Active}`,
			`download:${BridgeSetupStepState.Pending}`,
		]);

		expect(
			runtimeOf({
				phase: HytaleSetupPhase.Starting,
			}).prompt?.kind,
		).toBe(BridgeSetupPromptKind.Wait);
	});

	test("hands a signed-out bootstrap server the link, the code and its expiry", () => {
		const prompt = runtimeOf({
			phase: HytaleSetupPhase.Waiting,
			device: DEVICE,
			expiresAt: EXPIRES_AT,
		}).prompt;

		expect(prompt?.kind).toBe(BridgeSetupPromptKind.Link);
		expect(prompt).toMatchObject({
			url: DEVICE.url,
			code: DEVICE.code,
			expiresAt: "2026-09-04T10:00:00.000Z",
		});
		expect(prompt?.kind === BridgeSetupPromptKind.Link && prompt.actions.map((action) => action.id)).toEqual([
			"renew",
		]);
	});

	test("moves to the download the moment the sign-in succeeds", () => {
		expect(
			statesOf({
				phase: HytaleSetupPhase.Downloading,
				percent: null,
				detail: null,
			}),
		).toEqual([
			`sign-in:${BridgeSetupStepState.Done}`,
			`download:${BridgeSetupStepState.Active}`,
		]);
	});

	test("carries the percent and the sizes into the progress prompt", () => {
		expect(
			runtimeOf({
				phase: HytaleSetupPhase.Downloading,
				...progressOf(PROGRESS_LINE),
			}).prompt,
		).toEqual({
			kind: BridgeSetupPromptKind.Progress,
			message: expect.anything(),
			percent: 10,
			detail: "146.6 MiB / 1.4 GiB",
		});
	});

	test("tells the customer to wait for the relaunch once the payload is installed", () => {
		const runtime = runtimeOf({
			phase: HytaleSetupPhase.Installed,
		});

		expect(runtime.steps.every((step) => step.state === BridgeSetupStepState.Done)).toBe(true);
		expect(runtime.prompt?.kind).toBe(BridgeSetupPromptKind.Wait);
	});

	test("ends the flow with both steps done and nothing left to answer", () => {
		expect(
			runtimeOf({
				phase: HytaleSetupPhase.Ready,
			}),
		).toEqual({
			steps: [
				{
					id: "sign-in",
					state: BridgeSetupStepState.Done,
				},
				{
					id: "download",
					state: BridgeSetupStepState.Done,
				},
			],
			prompt: null,
		});
	});

	test("offers a new code once the renew budget is spent", () => {
		const prompt = runtimeOf({
			phase: HytaleSetupPhase.Expired,
		}).prompt;

		expect(prompt?.kind).toBe(BridgeSetupPromptKind.Action);
		expect(prompt?.kind === BridgeSetupPromptKind.Action && prompt.actions.map((action) => action.id)).toEqual([
			"renew",
		]);
	});

	test("offers a new code again after a sign-out, with the sign-in step re-opened", () => {
		expect(
			statesOf({
				phase: HytaleSetupPhase.SignedOut,
			}),
		).toEqual([
			`sign-in:${BridgeSetupStepState.Active}`,
			`download:${BridgeSetupStepState.Pending}`,
		]);
	});

	test("fails the step that broke, and never the one that already passed", () => {
		expect(
			statesOf({
				phase: HytaleSetupPhase.Failed,
				step: "sign-in",
				message: {
					ar: "خطأ",
					en: "Error",
				},
			}),
		).toEqual([
			`sign-in:${BridgeSetupStepState.Failed}`,
			`download:${BridgeSetupStepState.Pending}`,
		]);

		expect(
			statesOf({
				phase: HytaleSetupPhase.Failed,
				step: "download",
				message: {
					ar: "خطأ",
					en: "Error",
				},
			}),
		).toEqual([
			`sign-in:${BridgeSetupStepState.Done}`,
			`download:${BridgeSetupStepState.Failed}`,
		]);
	});

	test("puts a retry button on every failure", () => {
		const prompt = runtimeOf({
			phase: HytaleSetupPhase.Failed,
			step: "download",
			message: {
				ar: "خطأ",
				en: "Error",
			},
		}).prompt;

		expect(prompt?.kind).toBe(BridgeSetupPromptKind.Failed);
		expect(prompt?.kind === BridgeSetupPromptKind.Failed && prompt.actions.map((action) => action.id)).toEqual([
			"retry",
		]);
	});

	test("writes every prompt in both arabic and english", () => {
		const prompts = [
			runtimeOf({
				phase: HytaleSetupPhase.Starting,
			}).prompt,
			runtimeOf({
				phase: HytaleSetupPhase.Waiting,
				device: DEVICE,
				expiresAt: EXPIRES_AT,
			}).prompt,
			runtimeOf({
				phase: HytaleSetupPhase.Expired,
			}).prompt,
			runtimeOf({
				phase: HytaleSetupPhase.SignedOut,
			}).prompt,
			runtimeOf({
				phase: HytaleSetupPhase.Installed,
			}).prompt,
		];

		for (const prompt of prompts) {
			expect(prompt?.message.ar).not.toMatch(/[A-Za-z]{3}/);
			expect(prompt?.message.en).not.toMatch(/\p{Script=Arabic}/u);
		}
	});
});

describe("deciding what a boot has to do", () => {
	test("takes a bootstrap server straight to the sign-in unless the console says it is signed in", () => {
		expect(signedInAt(HytaleStage.Bootstrap, HytaleAuthState.SignedIn)).toBe(true);
		expect(signedInAt(HytaleStage.Bootstrap, HytaleAuthState.SignedOut)).toBe(false);
		expect(signedInAt(HytaleStage.Bootstrap, HytaleAuthState.Unknown)).toBe(false);
	});

	test("only re-opens the sign-in on an installed server when the console really said signed out", () => {
		expect(signedInAt(HytaleStage.Server, HytaleAuthState.SignedIn)).toBe(true);
		expect(signedInAt(HytaleStage.Server, HytaleAuthState.SignedOut)).toBe(false);
		expect(signedInAt(HytaleStage.Server, HytaleAuthState.Unknown)).toBe(true);
	});
});

describe("the renew budget", () => {
	test("keeps renewing until the budget is spent", () => {
		expect(exhausted(0)).toBe(false);
		expect(exhausted(RENEW_LIMIT - 1)).toBe(false);
		expect(exhausted(RENEW_LIMIT)).toBe(true);
	});
});
