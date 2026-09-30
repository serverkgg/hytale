import { afterEach, describe, expect, jest, test } from "bun:test";
import { type Bridge, BridgeSetupPromptKind, BridgeSetupStepState } from "@serverkgg/bridge";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import {
	AUTH_CANCEL_COMMAND,
	AUTH_LOGIN_COMMAND,
	AUTH_STATUS_COMMAND,
	AUTH_SUCCEEDED,
	HytaleAuthState,
	HytaleStage,
} from "../shared";
import {
	advanceSetup,
	cancelSignIn,
	DOWNLOAD_COMPLETE,
	DOWNLOAD_PROGRESS,
	DOWNLOAD_STEP,
	exhausted,
	HytaleSetupPhase,
	progressFrom,
	RENEW_LIMIT,
	renewSignIn,
	restartSignIn,
	runtimeOf,
	SIGN_IN_STEP,
	signedInAt,
	startingRuntime,
	stopSetup,
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

interface SetupHarness {
	context: Bridge.Context;
	reports: Bridge.SetupRuntime[];
}

const harness = (cancelsBeforeFailing = Number.POSITIVE_INFINITY): SetupHarness => {
	const reports: Bridge.SetupRuntime[] = [];
	const lines: string[] = [];

	let cancels = 0;

	const context = {
		files: {
			async exists() {
				return false;
			},
		},

		logs: {
			async tail() {
				return [
					...lines,
				];
			},

			follow() {
				return () => {
					return;
				};
			},
		},

		async command(input: string) {
			if (input === AUTH_STATUS_COMMAND) {
				lines.push("Not authenticated");

				return;
			}

			if (input === AUTH_CANCEL_COMMAND) {
				cancels += 1;

				if (cancels > cancelsBeforeFailing) {
					throw new Error("the console never answered the cancel");
				}

				return;
			}

			if (input === AUTH_LOGIN_COMMAND) {
				return await new Promise<void>(() => {
					return;
				});
			}
		},

		setup: {
			report(runtime: Bridge.SetupRuntime) {
				reports.push(runtime);
			},

			clear() {
				return;
			},
		},

		activity: {
			report() {
				return;
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
		reports,
	};
};

const IN_THE_DEVICE_LOGIN_MS = 200;

describe("the run a setup entry point waits on", () => {
	afterEach(() => {
		stopSetup();
	});

	test("answers the moment the run reports, rather than at the end of the flow", async () => {
		const { context, reports } = harness();

		await advanceSetup(context);

		expect(reports).toEqual([
			runtimeOf({
				phase: HytaleSetupPhase.Starting,
			}),
		]);
	});

	test("resolves the caller when the run is stopped before it ever reports", async () => {
		const { context, reports } = harness();

		const renewing = renewSignIn(context);

		await Bun.sleep(IN_THE_DEVICE_LOGIN_MS);

		expect(reports).toEqual([]);

		stopSetup();

		await renewing;

		expect(reports).toEqual([]);
	});

	test("frees a waiting caller even when the cancel that supersedes it fails", async () => {
		const { context } = harness(1);

		const renewing = renewSignIn(context);

		await Bun.sleep(IN_THE_DEVICE_LOGIN_MS);

		await expect(cancelSignIn(context)).rejects.toThrow("never answered the cancel");

		await renewing;
	});

	test("never lets one run's report answer another run's caller", async () => {
		const { context, reports } = harness();

		const renewing = renewSignIn(context);

		await Bun.sleep(IN_THE_DEVICE_LOGIN_MS);

		expect(reports).toEqual([]);

		const restarting = restartSignIn(context);

		await renewing;
		await restarting;

		expect(reports).toEqual([
			runtimeOf({
				phase: HytaleSetupPhase.Starting,
			}),
		]);
	});
});

enum DeviceAnswer {
	Code = "code",
	Nothing = "nothing",
}

interface FlowScript {
	device: DeviceAnswer;
	signsIn: boolean;
	downloads: boolean;
}

interface FlowHarness {
	context: Bridge.Context;
	reported: Bridge.Activity[];
	runtimes: Bridge.SetupRuntime[];
}

const SIGNED_IN_LINE = "[2026/09/04 09:57:02   INFO]   [AuthManager] Authentication successful! Mode: OAuth Device";

const DEVICE_LINES = [
	`Visit ${DEVICE.url} to sign in`,
	"The code expires in 599 seconds",
];

const flowHarness = (script: FlowScript): FlowHarness => {
	const reported: Bridge.Activity[] = [];
	const runtimes: Bridge.SetupRuntime[] = [];
	const lines: string[] = [];

	const printed = (pattern: RegExp) => {
		if (pattern === AUTH_SUCCEEDED && script.signsIn) {
			return SIGNED_IN_LINE;
		}

		return pattern === DOWNLOAD_COMPLETE && script.downloads ? COMPLETE_LINE : null;
	};

	const context = {
		files: {
			async exists() {
				return false;
			},
		},

		logs: {
			async tail() {
				return [
					...lines,
				];
			},

			follow(pattern: RegExp, onMatch: (match: RegExpMatchArray) => void) {
				const match = printed(pattern)?.match(pattern) ?? null;

				if (match !== null) {
					queueMicrotask(() => {
						onMatch(match);
					});
				}

				return () => {
					return;
				};
			},
		},

		async command(input: string) {
			if (input === AUTH_STATUS_COMMAND) {
				lines.push("Not authenticated");
			}

			if (input === AUTH_LOGIN_COMMAND && script.device === DeviceAnswer.Code) {
				lines.push(...DEVICE_LINES);
			}
		},

		setup: {
			report(runtime: Bridge.SetupRuntime) {
				runtimes.push(runtime);
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
		reported,
		runtimes,
	};
};

const FLOW_ROUNDS = 400;

const FLOW_STEP_MS = 60_000;

const settled = (runtimes: Bridge.SetupRuntime[], kind: BridgeSetupPromptKind) => {
	return runtimes.some((runtime) => runtime.prompt?.kind === kind);
};

const runFlow = async (done: () => boolean) => {
	for (let round = 0; round < FLOW_ROUNDS && !done(); round += 1) {
		jest.advanceTimersByTime(FLOW_STEP_MS);

		await new Promise<void>((resolve) => {
			queueMicrotask(resolve);
		});
	}
};

const expectNoSignInSecret = (reported: Bridge.Activity[]) => {
	const written = JSON.stringify(reported);

	expect(written).not.toContain(DEVICE.code);
	expect(written).not.toContain("user_code");
	expect(written).not.toContain("https://");
};

describe("the activity the setup flow reports on its own", () => {
	afterEach(() => {
		stopSetup();
		jest.useRealTimers();
	});

	test("reports the sign-in and the finished download as two completed steps", async () => {
		jest.useFakeTimers();

		const { context, reported, runtimes } = flowHarness({
			device: DeviceAnswer.Code,
			signsIn: true,
			downloads: true,
		});

		await advanceSetup(context);
		await runFlow(() => {
			return runtimes.some((runtime) => runtime.prompt?.message.en.startsWith("The download is done") === true);
		});

		expect(
			reported.map((entry) => [
				entry.name,
				entry.details?.step,
			]),
		).toEqual([
			[
				BridgeEventName.SetupCompleted,
				SIGN_IN_STEP,
			],
			[
				BridgeEventName.SetupCompleted,
				DOWNLOAD_STEP,
			],
		]);
		expect(reported.at(0)?.text.en).toBe("Signed the server in with a Hytale account");
		expectNoSignInSecret(reported);
	});

	test("reports the sign-in expired once every renewal ran out", async () => {
		jest.useFakeTimers();

		const { context, reported, runtimes } = flowHarness({
			device: DeviceAnswer.Code,
			signsIn: false,
			downloads: false,
		});

		await advanceSetup(context);
		await runFlow(() => {
			return settled(runtimes, BridgeSetupPromptKind.Action);
		});

		expect(reported).toEqual([
			{
				name: BridgeEventName.SignInExpired,
				text: {
					ar: "انتهى وقت كل رموز الدخول قبل ما يكتمل تسجيل الدخول في هايتيل",
					en: "Every sign-in code ran out before the Hytale sign-in finished",
				},
				details: {
					step: SIGN_IN_STEP,
					codes: RENEW_LIMIT + 1,
				},
			},
		]);
		expectNoSignInSecret(reported);
	});

	test("reports a stalled download with the text the failed prompt shows", async () => {
		jest.useFakeTimers();

		const { context, reported, runtimes } = flowHarness({
			device: DeviceAnswer.Code,
			signsIn: true,
			downloads: false,
		});

		await advanceSetup(context);
		await runFlow(() => {
			return settled(runtimes, BridgeSetupPromptKind.Failed);
		});

		const failed = runtimes.find((runtime) => runtime.prompt?.kind === BridgeSetupPromptKind.Failed);
		const rejected = reported.at(-1);

		expect(rejected?.name).toBe(BridgeEventName.SetupRejected);
		expect(rejected?.details).toEqual({
			step: DOWNLOAD_STEP,
		});
		expect(rejected?.text).toEqual(failed?.prompt?.message);
		expect(rejected?.text.en).toStartWith("The download stopped without finishing");
		expectNoSignInSecret(reported);
	});

	test("reports a step the flow could not carry on with the text the failed prompt shows", async () => {
		jest.useFakeTimers();

		const { context, reported, runtimes } = flowHarness({
			device: DeviceAnswer.Nothing,
			signsIn: false,
			downloads: false,
		});

		await advanceSetup(context);
		await runFlow(() => {
			return settled(runtimes, BridgeSetupPromptKind.Failed);
		});

		const failed = runtimes.find((runtime) => runtime.prompt?.kind === BridgeSetupPromptKind.Failed);

		expect(reported).toEqual([
			{
				name: BridgeEventName.SetupRejected,
				text: failed?.prompt?.message ?? {
					ar: "",
					en: "",
				},
				details: {
					step: SIGN_IN_STEP,
				},
			},
		]);
		expect(reported.at(0)?.text.en).toStartWith("Hytale printed no device code");
	});

	test("reports nothing for a run that was stopped before it finished", async () => {
		jest.useFakeTimers();

		const { context, reported, runtimes } = flowHarness({
			device: DeviceAnswer.Code,
			signsIn: true,
			downloads: true,
		});

		await advanceSetup(context);

		stopSetup();

		await runFlow(() => {
			return false;
		});

		expect(runtimes).toHaveLength(1);
		expect(reported).toEqual([]);
	});
});
