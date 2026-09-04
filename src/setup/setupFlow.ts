import { type Bridge, BridgeSetupPromptKind, BridgeSetupStepState, BridgeUserError } from "@serverkgg/bridge";
import {
	AUTH_SUCCEEDED,
	cancelDeviceLogin,
	downloadPayload,
	HytaleAuthState,
	type HytaleDeviceCode,
	HytaleStage,
	readAuth,
	stageOf,
	startDeviceLogin,
} from "../shared";

export const SIGN_IN_STEP = "sign-in";

export const DOWNLOAD_STEP = "download";

export const RENEW_ACTION = "renew";

export const CANCEL_ACTION = "cancel";

export const RETRY_ACTION = "retry";

export const RENEW_LIMIT = 3;

export const DOWNLOAD_PROGRESS = /Download progress: (?<percent>\d{1,3})% \((?<detail>[^)]+)\)/;

export const DOWNLOAD_COMPLETE = /Bootstrap install complete/;

const DOWNLOAD_TIMEOUT_MS = 3_600_000;

const FULL_PERCENT = 100;

const RENEW: Bridge.SetupAction = {
	id: RENEW_ACTION,
	label: {
		ar: "خذ رمز جديد",
		en: "Get a new code",
	},
};

const RETRY: Bridge.SetupAction = {
	id: RETRY_ACTION,
	label: {
		ar: "جرّب مرة ثانية",
		en: "Try again",
	},
};

const STARTING_MESSAGE: Bridge.Text = {
	ar: "نشغّل سيرفرك… ثواني وبيطلع لك رمز الدخول هنا.",
	en: "Starting your server — your sign-in code appears here in a moment.",
};

const LINK_MESSAGE: Bridge.Text = {
	ar: "افتح الرابط في المتصفح، سجّل دخول بحساب هايتيل حقك، والصق الرمز هذا.",
	en: "Open the link in your browser, sign in with your own Hytale account, and enter this code.",
};

const EXPIRED_MESSAGE: Bridge.Text = {
	ar: "انتهى وقت الرمز قبل ما تسجّل دخول. اضغط عشان ناخذ لك رمز جديد.",
	en: "The code ran out before the sign-in finished. Press to get a new one.",
};

const SIGNED_OUT_MESSAGE: Bridge.Text = {
	ar: "سيرفرك مسجّل خروج، وما يستقبل لاعبين. اضغط عشان ناخذ لك رمز دخول جديد.",
	en: "Your server is signed out, so it takes no players. Press to get a new sign-in code.",
};

const DOWNLOADING_MESSAGE: Bridge.Text = {
	ar: "سيرفرك سجّل دخوله وبدأ ينزّل ملفات اللعبة. حجمها كبير فتاخذ شوي.",
	en: "Your server signed in and started downloading the game files. They are large, so it takes a while.",
};

const RESTARTING_MESSAGE: Bridge.Text = {
	ar: "خلص التنزيل. سيرفرك يعيد التشغيل على نسخة اللعبة الكاملة.",
	en: "The download is done. Your server is restarting on the full game.",
};

const STALLED_MESSAGE: Bridge.Text = {
	ar: "وقف التنزيل ولا خلّص. جرّب مرة ثانية، وإذا تكرر افتح تذكرة دعم.",
	en: "The download stopped without finishing. Try again, and open a support ticket if it keeps happening.",
};

const FAILED_MESSAGE: Bridge.Text = {
	ar: "ما قدرنا نكمّل الخطوة. جرّب مرة ثانية.",
	en: "We could not finish this step. Try again.",
};

const UNKNOWN_STEP: Bridge.Text = {
	ar: "الخطوة هذي ما هي من خطوات تركيب هايتيل.",
	en: "That step is not part of the Hytale setup.",
};

const UNKNOWN_ACTION: Bridge.Text = {
	ar: "ما نعرف الزر هذا. حدّث الصفحة وجرّب مرة ثانية.",
	en: "We do not know that button. Refresh the page and try again.",
};

export enum HytaleSetupPhase {
	Starting = "starting",
	Waiting = "waiting",
	Expired = "expired",
	SignedOut = "signed-out",
	Downloading = "downloading",
	Installed = "installed",
	Ready = "ready",
	Failed = "failed",
}

export type HytaleSetupState =
	| {
			phase: HytaleSetupPhase.Starting;
	  }
	| {
			phase: HytaleSetupPhase.Waiting;
			device: HytaleDeviceCode;
			expiresAt: number;
	  }
	| {
			phase: HytaleSetupPhase.Expired;
	  }
	| {
			phase: HytaleSetupPhase.SignedOut;
	  }
	| {
			phase: HytaleSetupPhase.Downloading;
			percent: number | null;
			detail: string | null;
	  }
	| {
			phase: HytaleSetupPhase.Installed;
	  }
	| {
			phase: HytaleSetupPhase.Ready;
	  }
	| {
			phase: HytaleSetupPhase.Failed;
			step: string;
			message: Bridge.Text;
	  };

const stepsOf = (signIn: BridgeSetupStepState, download: BridgeSetupStepState): Bridge.SetupStepStatus[] => {
	return [
		{
			id: SIGN_IN_STEP,
			state: signIn,
		},
		{
			id: DOWNLOAD_STEP,
			state: download,
		},
	];
};

const signingIn = (prompt: Bridge.SetupPrompt): Bridge.SetupRuntime => {
	return {
		steps: stepsOf(BridgeSetupStepState.Active, BridgeSetupStepState.Pending),
		prompt,
	};
};

export const runtimeOf = (state: HytaleSetupState): Bridge.SetupRuntime => {
	switch (state.phase) {
		case HytaleSetupPhase.Starting: {
			return signingIn({
				kind: BridgeSetupPromptKind.Wait,
				message: STARTING_MESSAGE,
			});
		}

		case HytaleSetupPhase.Waiting: {
			return signingIn({
				kind: BridgeSetupPromptKind.Link,
				message: LINK_MESSAGE,
				url: state.device.url,
				code: state.device.code,
				expiresAt: new Date(state.expiresAt).toISOString(),
				actions: [
					RENEW,
				],
			});
		}

		case HytaleSetupPhase.Expired: {
			return signingIn({
				kind: BridgeSetupPromptKind.Action,
				message: EXPIRED_MESSAGE,
				actions: [
					RENEW,
				],
			});
		}

		case HytaleSetupPhase.SignedOut: {
			return signingIn({
				kind: BridgeSetupPromptKind.Action,
				message: SIGNED_OUT_MESSAGE,
				actions: [
					RENEW,
				],
			});
		}

		case HytaleSetupPhase.Downloading: {
			return {
				steps: stepsOf(BridgeSetupStepState.Done, BridgeSetupStepState.Active),
				prompt: {
					kind: BridgeSetupPromptKind.Progress,
					message: DOWNLOADING_MESSAGE,
					percent: state.percent,
					detail: state.detail,
				},
			};
		}

		case HytaleSetupPhase.Installed: {
			return {
				steps: stepsOf(BridgeSetupStepState.Done, BridgeSetupStepState.Done),
				prompt: {
					kind: BridgeSetupPromptKind.Wait,
					message: RESTARTING_MESSAGE,
				},
			};
		}

		case HytaleSetupPhase.Ready: {
			return {
				steps: stepsOf(BridgeSetupStepState.Done, BridgeSetupStepState.Done),
				prompt: null,
			};
		}

		case HytaleSetupPhase.Failed: {
			const failed = state.step === DOWNLOAD_STEP;

			return {
				steps: stepsOf(
					failed ? BridgeSetupStepState.Done : BridgeSetupStepState.Failed,
					failed ? BridgeSetupStepState.Failed : BridgeSetupStepState.Pending,
				),
				prompt: {
					kind: BridgeSetupPromptKind.Failed,
					message: state.message,
					actions: [
						RETRY,
					],
				},
			};
		}
	}
};

export const startingRuntime = (): Bridge.SetupRuntime => {
	return runtimeOf({
		phase: HytaleSetupPhase.Starting,
	});
};

export const progressFrom = (match: RegExpMatchArray) => {
	const percent = Number(match.groups?.percent ?? Number.NaN);
	const detail = match.groups?.detail?.trim() ?? "";

	return {
		percent: Number.isFinite(percent) ? Math.min(percent, FULL_PERCENT) : null,
		detail: detail.length > 0 ? detail : null,
	};
};

export const exhausted = (renewals: number) => {
	return renewals >= RENEW_LIMIT;
};

export const failureOf = (error: unknown): Bridge.Text => {
	return error instanceof BridgeUserError ? error.text : FAILED_MESSAGE;
};

interface SetupRun {
	stopped: boolean;
	step: string;
	stops: (() => void)[];
}

let running: SetupRun | null = null;

const stopRun = (run: SetupRun) => {
	run.stopped = true;

	for (const stop of run.stops.splice(0)) {
		stop();
	}
};

const startRun = (): SetupRun => {
	if (running !== null) {
		stopRun(running);
	}

	running = {
		stopped: false,
		step: SIGN_IN_STEP,
		stops: [],
	};

	return running;
};

export const stopSetup = () => {
	if (running !== null) {
		stopRun(running);
	}
};

const report = (context: Bridge.Context, run: SetupRun, state: HytaleSetupState) => {
	if (run.stopped) {
		return;
	}

	context.setup.report(runtimeOf(state));
};

const awaitLine = (context: Bridge.Context, run: SetupRun, pattern: RegExp, timeoutMs: number) => {
	return new Promise<RegExpMatchArray | null>((resolve) => {
		let unfollow: (() => void) | null = null;
		let timer: ReturnType<typeof setTimeout> | null = null;
		let settled = false;

		const settle = (match: RegExpMatchArray | null) => {
			if (settled) {
				return;
			}

			settled = true;

			if (timer !== null) {
				clearTimeout(timer);
			}

			unfollow?.();
			resolve(match);
		};

		timer = setTimeout(() => {
			settle(null);
		}, timeoutMs);

		unfollow = context.logs.follow(pattern, settle);

		run.stops.push(() => {
			settle(null);
		});
	});
};

const signIn = async (context: Bridge.Context, run: SetupRun) => {
	let renewals = 0;

	for (;;) {
		const device = await startDeviceLogin(context);

		if (run.stopped) {
			return false;
		}

		const timeoutMs = device.expiresInSeconds * 1000;

		report(context, run, {
			phase: HytaleSetupPhase.Waiting,
			device,
			expiresAt: Date.now() + timeoutMs,
		});

		context.log("a hytale device login is waiting for the customer", {
			url: device.url,
			expiresInSeconds: device.expiresInSeconds,
			renewals,
		});

		if ((await awaitLine(context, run, AUTH_SUCCEEDED, timeoutMs)) !== null) {
			return !run.stopped;
		}

		if (run.stopped) {
			return false;
		}

		await cancelDeviceLogin(context);

		if (exhausted(renewals)) {
			break;
		}

		renewals += 1;
	}

	report(context, run, {
		phase: HytaleSetupPhase.Expired,
	});

	return false;
};

const download = async (context: Bridge.Context, run: SetupRun) => {
	run.step = DOWNLOAD_STEP;

	report(context, run, {
		phase: HytaleSetupPhase.Downloading,
		percent: null,
		detail: null,
	});

	run.stops.push(
		context.logs.follow(DOWNLOAD_PROGRESS, (match) => {
			report(context, run, {
				phase: HytaleSetupPhase.Downloading,
				...progressFrom(match),
			});
		}),
	);

	const installed = awaitLine(context, run, DOWNLOAD_COMPLETE, DOWNLOAD_TIMEOUT_MS);

	await downloadPayload(context);

	const line = await installed;

	if (run.stopped) {
		return;
	}

	if (line === null) {
		report(context, run, {
			phase: HytaleSetupPhase.Failed,
			step: DOWNLOAD_STEP,
			message: STALLED_MESSAGE,
		});

		return;
	}

	report(context, run, {
		phase: HytaleSetupPhase.Installed,
	});
};

const flow = async (context: Bridge.Context, run: SetupRun, stage: HytaleStage, signedIn: boolean) => {
	if (stage === HytaleStage.Server) {
		if (signedIn || (await signIn(context, run))) {
			report(context, run, {
				phase: HytaleSetupPhase.Ready,
			});
		}

		return;
	}

	if (!signedIn && !(await signIn(context, run))) {
		return;
	}

	await download(context, run);
};

const drive = async (context: Bridge.Context, run: SetupRun, plan: () => Promise<void>) => {
	try {
		await plan();
	} catch (error) {
		context.log.warn("the hytale setup flow could not be carried on", {
			step: run.step,
			error: error instanceof Error ? error.message : String(error),
		});

		report(context, run, {
			phase: HytaleSetupPhase.Failed,
			step: run.step,
			message: failureOf(error),
		});
	} finally {
		stopRun(run);
	}
};

export const signedInAt = (stage: HytaleStage, state: HytaleAuthState) => {
	return stage === HytaleStage.Server ? state !== HytaleAuthState.SignedOut : state === HytaleAuthState.SignedIn;
};

export const advanceSetup = async (context: Bridge.Context) => {
	const run = startRun();

	await drive(context, run, async () => {
		const stage = await stageOf(context);
		const auth = await readAuth(context);

		await flow(context, run, stage, signedInAt(stage, auth.state));
	});
};

export const restartSignIn = async (context: Bridge.Context) => {
	const run = startRun();

	await drive(context, run, async () => {
		report(context, run, {
			phase: HytaleSetupPhase.Starting,
		});

		await flow(context, run, await stageOf(context), false);
	});
};

export const renewSignIn = async (context: Bridge.Context) => {
	stopSetup();

	await cancelDeviceLogin(context);

	void restartSignIn(context);
};

export const cancelSignIn = async (context: Bridge.Context) => {
	stopSetup();

	await cancelDeviceLogin(context);

	reportSignedOut(context);
};

export const reportSignedOut = (context: Bridge.Context) => {
	const run = startRun();

	report(context, run, {
		phase: HytaleSetupPhase.SignedOut,
	});

	stopRun(run);
};

export const unknownSetupStep = () => {
	return new BridgeUserError(UNKNOWN_STEP);
};

export const unknownSetupAction = () => {
	return new BridgeUserError(UNKNOWN_ACTION);
};
