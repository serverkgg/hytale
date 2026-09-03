import { type Bridge, BridgeDetailFormat, BridgeDetailTone, BridgeKind } from "@serverkgg/bridge";
import {
	DEVICE_CODE_TTL_SECONDS,
	endDeviceLogin,
	type HytaleAuthReport,
	HytaleAuthState,
	type HytaleDeviceCode,
	readAuth,
	startDeviceLogin,
} from "../shared";

export const LOGIN_START_ACTION = "begin";

export const LOGIN_LOGOUT_ACTION = "signout";

const DETAIL_ID = "hytale-login";

const PENDING_SLACK_MS = 5000;

const DETAIL_REFRESH_SECONDS = 15;

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

const VERIFY_LINK: Bridge.Text = {
	ar: "افتح صفحة التأكيد",
	en: "Open the verification page",
};

const TITLE = "Hytale";

const SUBTITLE_SIGNED_IN = "مسجّل الدخول — Signed in";

const SUBTITLE_SIGNED_OUT = "يحتاج تسجيل دخول — Needs a sign-in";

const DESCRIPTION_SIGNED_OUT = [
	"سيرفرك لازم يسجّل دخوله على شبكة هايتيل بحسابك مرة وحدة قبل ما يستقبل لاعبين.",
	"Your server signs in to the Hytale network with your own account, once, before it accepts players.",
].join("\n\n");

const DESCRIPTION_PENDING = [
	"افتح الرابط تحت في المتصفح، سجّل دخول بحساب هايتيل، والصق الرمز.",
	"Open the link below in your browser, sign in with your Hytale account, and enter the code.",
].join("\n\n");

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

const badgesOf = (report: HytaleAuthReport, waiting: boolean): Bridge.DetailBadge[] => {
	const badge =
		report.state === HytaleAuthState.SignedIn
			? SIGNED_IN_BADGE
			: report.state === HytaleAuthState.SignedOut
				? SIGNED_OUT_BADGE
				: UNKNOWN_BADGE;

	return waiting
		? [
				badge,
				PENDING_BADGE,
			]
		: [
				badge,
			];
};

const statsOf = (report: HytaleAuthReport, waiting: PendingLogin | null): Bridge.DetailStat[] => {
	return [
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

export const login: Bridge.Detail = {
	kind: BridgeKind.Detail,
	requiresRunning: true,
	refreshSeconds: DETAIL_REFRESH_SECONDS,

	async read(context) {
		const report = await readAuth(context);
		const waiting = report.state === HytaleAuthState.SignedIn ? null : livePending(Date.now());

		return {
			id: DETAIL_ID,
			title: TITLE,
			subtitle: report.state === HytaleAuthState.SignedIn ? SUBTITLE_SIGNED_IN : SUBTITLE_SIGNED_OUT,
			description:
				waiting === null
					? report.state === HytaleAuthState.SignedIn
						? report.lines.join("\n")
						: DESCRIPTION_SIGNED_OUT
					: DESCRIPTION_PENDING,
			image: null,
			badges: badgesOf(report, waiting !== null),
			stats: statsOf(report, waiting),
			links:
				waiting === null
					? []
					: [
							{
								label: VERIFY_LINK,
								url: waiting.url,
							},
						],
			stale: report.state !== HytaleAuthState.SignedIn,
			actions:
				report.state === HytaleAuthState.SignedIn
					? [
							LOGIN_LOGOUT_ACTION,
						]
					: [
							LOGIN_START_ACTION,
						],
		};
	},

	actions: {
		[LOGIN_START_ACTION]: async (context) => {
			const device = await startDeviceLogin(context);

			pending = {
				...device,
				expiresAt: Date.now() + DEVICE_CODE_TTL_SECONDS * 1000 - PENDING_SLACK_MS,
			};

			context.log("a hytale device login is waiting for the customer", {
				url: device.url,
			});

			return null;
		},

		[LOGIN_LOGOUT_ACTION]: async (context) => {
			pending = null;

			await endDeviceLogin(context);

			return null;
		},
	},
};
