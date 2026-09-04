import { type Bridge, BridgeDetailFormat, BridgeDetailTone, BridgeKind } from "@serverkgg/bridge";
import { reportSignedOut, restartSignIn } from "../setup";
import { endDeviceLogin, type HytaleAuthReport, HytaleAuthState, HytaleStage, readAuth, stageOf } from "../shared";

export const LOGIN_SWITCH_ACTION = "switch";

export const LOGIN_LOGOUT_ACTION = "signout";

const DETAIL_ID = "hytale-account";

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

const SUBTITLE_SIGNED_IN: Bridge.Text = {
	ar: "مسجّل الدخول",
	en: "Signed in",
};

const SUBTITLE_SIGNED_OUT: Bridge.Text = {
	ar: "يحتاج تسجيل دخول",
	en: "Needs a sign-in",
};

const NEXT_SETUP: Bridge.Text = {
	ar: "سيرفرك لسه يجهّز. صفحة التركيب تمشيك خطوة خطوة وتطلع لك رمز الدخول فيها.",
	en: "Your server is still setting up. The setup page walks you through it and shows your sign-in code.",
};

const NEXT_DOWNLOADING: Bridge.Text = {
	ar: "سيرفرك سجّل دخوله وبدأ ينزّل ملفات اللعبة. العملية تاخذ شوي، تابعها من صفحة التركيب، وبعدها يشتغل لحاله.",
	en: "Your server signed in and started downloading the game files. It takes a while — follow it on the setup page, then it starts on its own.",
};

const NEXT_SIGNED_OUT: Bridge.Text = {
	ar: "سيرفرك مركّب بس مسجّل خروج، وما يستقبل لاعبين. اضغط «بدّل الحساب» وبيطلع لك رمز دخول جديد في صفحة التركيب.",
	en: "Your server is installed but signed out, so it takes no players. Press Switch account and a new sign-in code appears on the setup page.",
};

const stageBadge = (stage: HytaleStage, state: HytaleAuthState) => {
	if (stage === HytaleStage.Server) {
		return READY_BADGE;
	}

	return state === HytaleAuthState.SignedIn ? DOWNLOADING_BADGE : SETUP_BADGE;
};

const accountBadge = (state: HytaleAuthState, profile: string | null): Bridge.DetailBadge => {
	if (state !== HytaleAuthState.SignedIn) {
		return state === HytaleAuthState.SignedOut ? SIGNED_OUT_BADGE : UNKNOWN_BADGE;
	}

	if (profile === null) {
		return SIGNED_IN_BADGE;
	}

	return {
		tone: BridgeDetailTone.Success,
		label: {
			ar: `مسجّل الدخول بحساب ${profile}`,
			en: `Signed in as ${profile}`,
		},
	};
};

export const badgesOf = (stage: HytaleStage, state: HytaleAuthState, profile: string | null): Bridge.DetailBadge[] => {
	return [
		stageBadge(stage, state),
		accountBadge(state, profile),
	];
};

export const nextStep = (stage: HytaleStage, state: HytaleAuthState) => {
	if (stage === HytaleStage.Bootstrap) {
		return state === HytaleAuthState.SignedIn ? NEXT_DOWNLOADING : NEXT_SETUP;
	}

	return state === HytaleAuthState.SignedIn ? null : NEXT_SIGNED_OUT;
};

const statsOf = (report: HytaleAuthReport): Bridge.DetailStat[] => {
	return [
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

const actionsOf = (state: HytaleAuthState) => {
	return state === HytaleAuthState.SignedIn
		? [
				LOGIN_SWITCH_ACTION,
				LOGIN_LOGOUT_ACTION,
			]
		: [
				LOGIN_SWITCH_ACTION,
			];
};

export const login: Bridge.Detail = {
	kind: BridgeKind.Detail,
	requiresRunning: true,
	refreshSeconds: DETAIL_REFRESH_SECONDS,

	async read(context) {
		const stage = await stageOf(context);
		const report = await readAuth(context);
		const step = nextStep(stage, report.state);

		return {
			id: DETAIL_ID,
			title: TITLE,
			subtitle: report.state === HytaleAuthState.SignedIn ? SUBTITLE_SIGNED_IN : SUBTITLE_SIGNED_OUT,
			description: step ?? report.lines.join("\n"),
			image: null,
			badges: badgesOf(stage, report.state, report.profile),
			stats: statsOf(report),
			links: [],
			stale: report.state !== HytaleAuthState.SignedIn || stage === HytaleStage.Bootstrap,
			actions: actionsOf(report.state),
		};
	},

	actions: {
		[LOGIN_SWITCH_ACTION]: async (context) => {
			await endDeviceLogin(context);

			void restartSignIn(context);

			return null;
		},

		[LOGIN_LOGOUT_ACTION]: async (context) => {
			await endDeviceLogin(context);

			reportSignedOut(context);

			return null;
		},
	},
};
