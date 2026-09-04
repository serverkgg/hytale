import { type Bridge, BridgeDetailFormat, BridgeDetailTone, BridgeKind } from "@serverkgg/bridge";
import {
	awaitAuthorization,
	cancelDeviceLogin,
	downloadPayload,
	endDeviceLogin,
	type HytaleAuthReport,
	HytaleAuthState,
	type HytaleDeviceCode,
	HytaleStage,
	readAuth,
	stageOf,
	startDeviceLogin,
} from "../shared";

export const LOGIN_START_ACTION = "begin";

export const LOGIN_CANCEL_ACTION = "cancel";

export const LOGIN_LOGOUT_ACTION = "signout";

const DETAIL_ID = "hytale-login";

const PENDING_SLACK_MS = 5000;

const DETAIL_REFRESH_SECONDS = 15;

const TITLE = "Hytale";

const SIGNED_IN_BADGE: Bridge.DetailBadge = {
	tone: BridgeDetailTone.Success,
	label: {
		ar: "مسجّل الدخول",
		en: "Signed in",
	},
};

const SIGNED_OUT_BADGE: Bridge.DetailBadge = {
	tone: BridgeDetailTone.Warning,
	label: {
		ar: "ما سجّل دخول",
		en: "Not signed in",
	},
};

const UNKNOWN_BADGE: Bridge.DetailBadge = {
	tone: BridgeDetailTone.Neutral,
	label: {
		ar: "ما قدرنا نقرأ الحالة",
		en: "Status unreadable",
	},
};

const PENDING_BADGE: Bridge.DetailBadge = {
	tone: BridgeDetailTone.Warning,
	label: {
		ar: "بانتظار تأكيدك",
		en: "Waiting for you",
	},
};

const SETUP_BADGE: Bridge.DetailBadge = {
	tone: BridgeDetailTone.Neutral,
	label: {
		ar: "مرحلة التركيب",
		en: "Setup stage",
	},
};

const DOWNLOADING_BADGE: Bridge.DetailBadge = {
	tone: BridgeDetailTone.Neutral,
	label: {
		ar: "ينزّل ملفات اللعبة",
		en: "Downloading the game",
	},
};

const READY_BADGE: Bridge.DetailBadge = {
	tone: BridgeDetailTone.Success,
	label: {
		ar: "السيرفر مركّب",
		en: "Server installed",
	},
};

const VERIFY_LINK: Bridge.Text = {
	ar: "افتح صفحة التأكيد",
	en: "Open the verification page",
};

const SUBTITLE_SIGNED_IN: Bridge.Text = {
	ar: "مسجّل الدخول",
	en: "Signed in",
};

const SUBTITLE_SIGNED_OUT: Bridge.Text = {
	ar: "يحتاج تسجيل دخول",
	en: "Needs a sign-in",
};

const STAGE_SERVER: Bridge.Text = {
	ar: "السيرفر",
	en: "Server",
};

const STAGE_SETUP: Bridge.Text = {
	ar: "التركيب",
	en: "Setup",
};

const NEXT_SETUP: Bridge.Text = {
	ar: "اضغط «ابدأ الدخول»، سجّل دخول بحساب هايتيل حقك، وبعدها سيرفرك ينزّل ملفات اللعبة ويشتغل لحاله.",
	en: "Press Start login, sign in with your own Hytale account, and your server then downloads the game files and comes up on its own.",
};

const NEXT_PENDING: Bridge.Text = {
	ar: "افتح الرابط تحت في المتصفح، سجّل دخول بحساب هايتيل، والصق الرمز. لا تسكّر اللوحة.",
	en: "Open the link below in your browser, sign in with your Hytale account, and enter the code. Keep this page open.",
};

const NEXT_DOWNLOADING: Bridge.Text = {
	ar: "سيرفرك سجّل دخوله وبدأ ينزّل ملفات اللعبة. العملية تاخذ شوي، تابعها من الكونسول، وبعدها يشتغل لحاله.",
	en: "Your server signed in and started downloading the game files. It takes a while — watch the console, then it starts on its own.",
};

const NEXT_SIGNED_OUT: Bridge.Text = {
	ar: "سيرفرك مركّب بس مسجّل خروج، وما يستقبل لاعبين. اضغط «ابدأ الدخول» عشان يرجع.",
	en: "Your server is installed but signed out, so it takes no players. Press Start login to bring it back.",
};

interface PendingLogin extends HytaleDeviceCode {
	expiresAt: number;
}

let pending: PendingLogin | null = null;

export const livePending = (now: number): PendingLogin | null => {
	if (pending === null || pending.expiresAt <= now) {
		pending = null;
	}

	return pending;
};

const stageBadge = (stage: HytaleStage, state: HytaleAuthState) => {
	if (stage === HytaleStage.Server) {
		return READY_BADGE;
	}

	return state === HytaleAuthState.SignedIn ? DOWNLOADING_BADGE : SETUP_BADGE;
};

const authBadge = (state: HytaleAuthState) => {
	if (state === HytaleAuthState.SignedIn) {
		return SIGNED_IN_BADGE;
	}

	return state === HytaleAuthState.SignedOut ? SIGNED_OUT_BADGE : UNKNOWN_BADGE;
};

export const badgesOf = (stage: HytaleStage, state: HytaleAuthState, waiting: boolean): Bridge.DetailBadge[] => {
	if (waiting) {
		return [
			stageBadge(stage, state),
			PENDING_BADGE,
		];
	}

	return [
		stageBadge(stage, state),
		authBadge(state),
	];
};

export const nextStep = (stage: HytaleStage, state: HytaleAuthState, waiting: boolean) => {
	if (waiting) {
		return NEXT_PENDING;
	}

	if (stage === HytaleStage.Bootstrap) {
		return state === HytaleAuthState.SignedIn ? NEXT_DOWNLOADING : NEXT_SETUP;
	}

	return state === HytaleAuthState.SignedIn ? null : NEXT_SIGNED_OUT;
};

const statsOf = (stage: HytaleStage, report: HytaleAuthReport, waiting: PendingLogin | null): Bridge.DetailStat[] => {
	return [
		{
			key: "stage",
			label: {
				ar: "المرحلة",
				en: "Stage",
			},
			value: stage === HytaleStage.Server ? STAGE_SERVER : STAGE_SETUP,
			format: BridgeDetailFormat.Text,
		},
		...(waiting === null
			? []
			: [
					{
						key: "code",
						label: {
							ar: "رمز التأكيد",
							en: "Verification code",
						},
						value: waiting.code,
						format: BridgeDetailFormat.Text,
					},
					{
						key: "expiresAt",
						label: {
							ar: "ينتهي",
							en: "Expires",
						},
						value: new Date(waiting.expiresAt).toISOString(),
						format: BridgeDetailFormat.Date,
					},
				]),
		{
			key: "mode",
			label: {
				ar: "طريقة الدخول",
				en: "Sign-in mode",
			},
			value: report.mode,
			format: BridgeDetailFormat.Text,
		},
	];
};

const actionsOf = (state: HytaleAuthState, waiting: boolean) => {
	if (waiting) {
		return [
			LOGIN_CANCEL_ACTION,
		];
	}

	return state === HytaleAuthState.SignedIn
		? [
				LOGIN_LOGOUT_ACTION,
			]
		: [
				LOGIN_START_ACTION,
			];
};

const collectPayload = async (context: Bridge.Context, timeoutMs: number) => {
	if (!(await awaitAuthorization(context, timeoutMs))) {
		return;
	}

	pending = null;

	if ((await stageOf(context)) === HytaleStage.Server) {
		return;
	}

	context.log("hytale accepted the sign-in, pulling the server payload");

	await downloadPayload(context);
};

export const login: Bridge.Detail = {
	kind: BridgeKind.Detail,
	requiresRunning: true,
	refreshSeconds: DETAIL_REFRESH_SECONDS,

	async read(context) {
		const stage = await stageOf(context);
		const report = await readAuth(context);
		const waiting = report.state === HytaleAuthState.SignedIn ? null : livePending(Date.now());
		const step = nextStep(stage, report.state, waiting !== null);

		return {
			id: DETAIL_ID,
			title: TITLE,
			subtitle: report.state === HytaleAuthState.SignedIn ? SUBTITLE_SIGNED_IN : SUBTITLE_SIGNED_OUT,
			description: step ?? report.lines.join("\n"),
			image: null,
			badges: badgesOf(stage, report.state, waiting !== null),
			stats: statsOf(stage, report, waiting),
			links:
				waiting === null
					? []
					: [
							{
								label: VERIFY_LINK,
								url: waiting.url,
							},
						],
			stale: report.state !== HytaleAuthState.SignedIn || stage === HytaleStage.Bootstrap,
			actions: actionsOf(report.state, waiting !== null),
		};
	},

	actions: {
		[LOGIN_START_ACTION]: async (context) => {
			const device = await startDeviceLogin(context);
			const timeoutMs = device.expiresInSeconds * 1000;

			pending = {
				...device,
				expiresAt: Date.now() + timeoutMs - PENDING_SLACK_MS,
			};

			context.log("a hytale device login is waiting for the customer", {
				url: device.url,
				expiresInSeconds: device.expiresInSeconds,
			});

			void collectPayload(context, timeoutMs).catch((error: unknown) => {
				context.log.warn("the hytale payload download could not be started", {
					error: error instanceof Error ? error.message : String(error),
				});
			});

			return null;
		},

		[LOGIN_CANCEL_ACTION]: async (context) => {
			pending = null;

			await cancelDeviceLogin(context);

			return null;
		},

		[LOGIN_LOGOUT_ACTION]: async (context) => {
			pending = null;

			await endDeviceLogin(context);

			return null;
		},
	},
};
