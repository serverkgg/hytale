import {
	type Bridge,
	BridgeConfirm,
	BridgeControl,
	BridgeFormTarget,
	BridgeIcon,
	BridgeLayout,
} from "@serverkgg/bridge";
import { LOGIN_CANCEL_ACTION, LOGIN_LOGOUT_ACTION, LOGIN_START_ACTION } from "../details";
import { ANNOUNCE_MESSAGE_LENGTH } from "../shared";

const MAX_VIEW_RADIUS = 32;

const loginTab: Bridge.Tab = {
	id: "login",
	title: {
		ar: "الدخول",
		en: "Login",
	},
	icon: BridgeIcon.Shield,
	sections: [
		{
			layout: BridgeLayout.Detail,
			id: "hytale-account",
			title: {
				ar: "تسجيل دخول سيرفرك",
				en: "Sign your server in",
			},
			module: "login",
			actions: [
				{
					id: LOGIN_START_ACTION,
					label: {
						ar: "ابدأ الدخول",
						en: "Start login",
					},
				},
				{
					id: LOGIN_CANCEL_ACTION,
					label: {
						ar: "ألغِ الدخول",
						en: "Cancel login",
					},
				},
				{
					id: LOGIN_LOGOUT_ACTION,
					label: {
						ar: "سجّل خروج",
						en: "Sign out",
					},
					confirm: BridgeConfirm.Strong,
					confirmText: {
						ar: "بنمسح تسجيل الدخول من سيرفرك، وما يقدر يستقبل لاعبين إلا لما تسجّل دخول من جديد.",
						en: "We clear the sign-in from your server, and it cannot accept players until you sign in again.",
					},
				},
			],
			empty: {
				ar: "شغّل سيرفرك أول عشان نقدر نقرأ حالة الدخول.",
				en: "Start your server first so we can read its sign-in status.",
			},
		},
	],
};

const settingsTab: Bridge.Tab = {
	id: "settings",
	title: {
		ar: "الإعدادات",
		en: "Settings",
	},
	icon: BridgeIcon.Settings,
	sections: [
		{
			layout: BridgeLayout.Form,
			id: "server",
			target: BridgeFormTarget.Settings,
			module: "settings",
			restartHint: true,
			fields: [
				{
					key: "ServerName",
					control: BridgeControl.Text,
					label: {
						ar: "اسم السيرفر",
						en: "Server name",
					},
					help: {
						ar: "الاسم اللي يظهر للاعبين لما يدخلون.",
						en: "Shown to players when they join.",
					},
					maxLength: 48,
				},
				{
					key: "MOTD",
					control: BridgeControl.Text,
					label: {
						ar: "رسالة الترحيب",
						en: "Welcome message",
					},
					help: {
						ar: "سطر قصير يشوفه اللاعب أول ما يدخل.",
						en: "One short line the player sees on join.",
					},
					maxLength: 128,
				},
				{
					key: "Password",
					control: BridgeControl.Text,
					label: {
						ar: "كلمة مرور الدخول",
						en: "Join password",
					},
					help: {
						ar: "اتركها فاضية عشان يكون السيرفر مفتوح للجميع.",
						en: "Leave empty to keep the server open to everyone.",
					},
					maxLength: 32,
				},
				{
					key: "MaxPlayers",
					control: BridgeControl.Number,
					label: {
						ar: "أقصى عدد لاعبين",
						en: "Max players",
					},
					help: {
						ar: "كل ما زاد العدد، زاد استهلاك الرام والمعالج.",
						en: "The higher it goes, the more RAM and CPU your server uses.",
					},
					min: 1,
					max: 200,
				},
				{
					key: "MaxViewRadius",
					control: BridgeControl.Slider,
					label: {
						ar: "مدى الرؤية",
						en: "View distance",
					},
					help: {
						ar: "أكبر عامل يستهلك الرام. هايتيل تنصح ما تتجاوز 12، وكل ما زاد يبي رام أكثر.",
						en: "The biggest driver of RAM use. Hytale recommends staying at or below 12 — the higher it goes, the more RAM you need.",
					},
					min: 1,
					max: MAX_VIEW_RADIUS,
				},
			],
		},
	],
};

const playersTab: Bridge.Tab = {
	id: "players",
	title: {
		ar: "اللاعبين",
		en: "Players",
	},
	icon: BridgeIcon.Users,
	sections: [
		{
			layout: BridgeLayout.Table,
			id: "online",
			module: "players",
			columns: [
				{
					key: "name",
					label: {
						ar: "اللاعب",
						en: "Player",
					},
				},
				{
					key: "username",
					label: {
						ar: "اسم الحساب",
						en: "Account",
					},
				},
			],
			actions: [
				{
					id: "kick",
					label: {
						ar: "طرد",
						en: "Kick",
					},
					confirm: BridgeConfirm.Normal,
				},
				{
					id: "ban",
					label: {
						ar: "حظر",
						en: "Ban",
					},
					confirm: BridgeConfirm.Strong,
				},
			],
			empty: {
				ar: "ما فيه أحد داخل الحين.",
				en: "Nobody is online right now.",
			},
		},
	],
};

const controlsTab: Bridge.Tab = {
	id: "controls",
	title: {
		ar: "التحكم",
		en: "Controls",
	},
	icon: BridgeIcon.Command,
	sections: [
		{
			layout: BridgeLayout.Actions,
			id: "live",
			title: {
				ar: "أوامر سريعة",
				en: "Quick actions",
			},
			help: {
				ar: "تشتغل على طول على سيرفرك الشغّال.",
				en: "These run on your server right away.",
			},
			module: "live",
			actions: [
				{
					id: "announce",
					label: {
						ar: "رسالة للاعبين",
						en: "Announce",
					},
					fields: [
						{
							key: "message",
							control: BridgeControl.Text,
							label: {
								ar: "الرسالة",
								en: "Message",
							},
							help: {
								ar: "توصل لكل اللي داخلين الحين.",
								en: "Reaches everyone who is on the server right now.",
							},
							maxLength: ANNOUNCE_MESSAGE_LENGTH,
						},
					],
				},
				{
					id: "whitelist",
					label: {
						ar: "القائمة البيضاء",
						en: "Whitelist",
					},
					fields: [
						{
							key: "enabled",
							control: BridgeControl.Boolean,
							label: {
								ar: "فعّل القائمة البيضاء",
								en: "Turn the whitelist on",
							},
							help: {
								ar: "لما تفعّلها، ما يدخل إلا اللي أضفتهم.",
								en: "While it is on, only the players you added can join.",
							},
						},
					],
				},
				{
					id: "allow",
					label: {
						ar: "أضف للقائمة البيضاء",
						en: "Add to whitelist",
					},
					fields: [
						{
							key: "username",
							control: BridgeControl.Text,
							label: {
								ar: "اسم حساب اللاعب",
								en: "Player account name",
							},
							help: {
								ar: "اسم حساب هايتيل بالضبط، مو الاسم الظاهر.",
								en: "The exact Hytale account name, not the display name.",
							},
							maxLength: 32,
						},
					],
				},
				{
					id: "disallow",
					label: {
						ar: "شِل من القائمة البيضاء",
						en: "Remove from whitelist",
					},
					fields: [
						{
							key: "username",
							control: BridgeControl.Text,
							label: {
								ar: "اسم حساب اللاعب",
								en: "Player account name",
							},
							help: {
								ar: "إذا كان اللاعب داخل الحين، يطلع بعد إعادة التشغيل الجاية.",
								en: "If the player is online right now, they are out after the next restart.",
							},
							maxLength: 32,
						},
					],
				},
			],
		},
	],
};

export const panel: Bridge.Panel = {
	tabs: [
		loginTab,
		settingsTab,
		playersTab,
		controlsTab,
	],
};
