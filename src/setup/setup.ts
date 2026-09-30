import { type Bridge, BridgeKind, BridgeSetupStepKind } from "@serverkgg/bridge";
import { GuideOpenTab } from "@serverkgg/bridge/guides";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import {
	advanceSetup,
	CANCEL_ACTION,
	cancelSignIn,
	DOWNLOAD_STEP,
	RENEW_ACTION,
	RETRY_ACTION,
	renewSignIn,
	SIGN_IN_STEP,
	unknownSetupAction,
	unknownSetupStep,
} from "./setupFlow";

export const SETTINGS_TAB = "settings";

export const SERVER_SECTION = "server";

export const NAME_STEP = "name";

export const INVITE_STEP = "invite";

export const ACCOUNT_TARGET = "account";

const RETRIED_SIGN_IN: Bridge.Text = {
	ar: "تمت إعادة تسجيل دخول السيرفر في هايتيل",
	en: "Restarted the Hytale sign-in",
};

const RETRIED_DOWNLOAD: Bridge.Text = {
	ar: "تمت إعادة تنزيل ملفات هايتيل",
	en: "Restarted the Hytale game file download",
};

const RENEWED_SIGN_IN: Bridge.Text = {
	ar: "تم طلب رمز دخول جديد لهايتيل",
	en: "Requested a new Hytale sign-in code",
};

const CANCELLED_SIGN_IN: Bridge.Text = {
	ar: "تم إلغاء تسجيل دخول السيرفر في هايتيل",
	en: "Cancelled the Hytale sign-in",
};

const reportAction = (context: Bridge.Context, step: string, action: string, text: Bridge.Text) => {
	context.activity.report({
		name: BridgeEventName.SetupAction,
		text,
		details: {
			step,
			action,
		},
	});
};

export const setup: Bridge.Setup = {
	kind: BridgeKind.Setup,
	steps: [
		{
			kind: BridgeSetupStepKind.Driver,
			id: SIGN_IN_STEP,
			requiresRunning: true,
			title: {
				ar: "سجّل دخول سيرفرك",
				en: "Sign your server in",
			},
			help: {
				ar: "سيرفرك يعرّف نفسه على شبكة هايتيل بحسابك أنت، مرة وحدة بس. بيطلع لك رمز ورابط تحت — افتح الرابط وسجّل دخول بحساب هايتيل حقك.",
				en: "Your server identifies itself to the Hytale network with your own account, once. A code and a link appear below — open the link and sign in with your Hytale account.",
			},
		},
		{
			kind: BridgeSetupStepKind.Driver,
			id: DOWNLOAD_STEP,
			title: {
				ar: "نزّل ملفات اللعبة",
				en: "Download the game files",
			},
			help: {
				ar: "بعد الدخول ينزّل سيرفرك ملفات اللعبة لحاله. حجمها كبير فتاخذ شوي، وبعدها يعيد التشغيل على نسخة اللعبة الكاملة.",
				en: "After the sign-in your server downloads the game files on its own. They are large, so it takes a while, then it restarts on the full game.",
			},
		},
		{
			kind: BridgeSetupStepKind.Form,
			id: NAME_STEP,
			required: false,
			tab: SETTINGS_TAB,
			section: SERVER_SECTION,
			fields: [
				"ServerName",
				"MOTD",
				"Password",
				"MaxPlayers",
			],
			title: {
				ar: "سمِّ سيرفرك",
				en: "Name your server",
			},
			help: {
				ar: "الاسم اللي يشوفه اللاعبين، رسالة الترحيب، كلمة مرور الدخول، وعدد اللاعبين. تقدر تتخطاها وتعدّلها بعدين من تبويب الإعدادات.",
				en: "The name players see, the welcome message, the join password and the player slots. You can skip this and change it later from the Settings tab.",
			},
		},
		{
			kind: BridgeSetupStepKind.Open,
			id: INVITE_STEP,
			required: false,
			target: {
				tab: GuideOpenTab.Access,
			},
			title: {
				ar: "عزّم أصحابك",
				en: "Invite your friends",
			},
			help: {
				ar: "انسخ عنوان سيرفرك وأرسله لأصحابك عشان يدخلون معك من Direct Connect.",
				en: "Copy your server address and send it to your friends so they can join you from Direct Connect.",
			},
		},
	],

	async submit(context, step, action) {
		if (step !== SIGN_IN_STEP && step !== DOWNLOAD_STEP) {
			throw unknownSetupStep();
		}

		if (action === RETRY_ACTION) {
			await advanceSetup(context);

			reportAction(context, step, action, step === SIGN_IN_STEP ? RETRIED_SIGN_IN : RETRIED_DOWNLOAD);

			return;
		}

		if (step !== SIGN_IN_STEP) {
			throw unknownSetupAction();
		}

		if (action === RENEW_ACTION) {
			await renewSignIn(context);

			reportAction(context, step, action, RENEWED_SIGN_IN);

			return;
		}

		if (action === CANCEL_ACTION) {
			await cancelSignIn(context);

			reportAction(context, step, action, CANCELLED_SIGN_IN);

			return;
		}

		throw unknownSetupAction();
	},
};
