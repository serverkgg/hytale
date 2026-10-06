import {
	type Bridge,
	BridgeConfirm,
	BridgeControl,
	BridgeFormTarget,
	BridgeIcon,
	BridgeLayout,
	BridgePlace,
} from "@serverkgg/bridge";
import { LOGIN_LOGOUT_ACTION, LOGIN_SWITCH_ACTION } from "../details";
import { ANNOUNCE_MESSAGE_LENGTH } from "../shared";

const MAX_VIEW_RADIUS = 32;

const accountTab: Bridge.Tab = {
	id: "account",
	title: {
		ar: "الحساب",
		en: "Account",
	},
	icon: BridgeIcon.Shield,
	sections: [
		{
			layout: BridgeLayout.Detail,
			id: "hytale-account",
			title: {
				ar: "حساب هايتيل المربوط بسيرفرك",
				en: "The Hytale account your server uses",
			},
			help: {
				ar: "يدخل سيرفرك هايتيل بهذا الحساب. بدّله أو سجّل الخروج منه من هنا.",
				en: "Your server signs in to Hytale with this account. Switch it or sign it out here.",
			},
			module: "login",
			actions: [
				{
					id: LOGIN_SWITCH_ACTION,
					label: {
						ar: "بدّل الحساب",
						en: "Switch account",
					},
				},
				{
					id: LOGIN_LOGOUT_ACTION,
					label: {
						ar: "سجّل الخروج",
						en: "Sign out",
					},
					confirm: BridgeConfirm.Normal,
					confirmText: {
						ar: "نحذف تسجيل الدخول من سيرفرك، ولن يستقبل لاعبين حتى تسجّل الدخول من جديد.",
						en: "We clear the sign-in from your server, and it can't accept players until you sign in again.",
					},
				},
			],
			empty: {
				ar: "شغّل سيرفرك أولًا لكي نقرأ حالة الحساب.",
				en: "Start your server first so we can read its account status.",
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
			help: {
				ar: "إعدادات سيرفرك الأساسية، وكل تعديل فيها يتطلب ريستارت.",
				en: "Your server's core settings. Every change here needs a restart.",
			},
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
						ar: "الاسم الذي يظهر للاعبين عند دخولهم.",
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
						ar: "سطر قصير يظهر للاعب عند دخوله.",
						en: "One short line the player sees on join.",
					},
					maxLength: 128,
				},
				{
					key: "Password",
					control: BridgeControl.Secret,
					label: {
						ar: "كلمة مرور الدخول",
						en: "Join password",
					},
					help: {
						ar: "اتركها فارغة ليكون السيرفر مفتوحًا للجميع.",
						en: "Leave it empty to keep the server open to everyone.",
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
						ar: "كلما زاد العدد، زاد استهلاك الرام والمعالج.",
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
						ar: "أكثر ما يستهلك الرام. توصي هايتيل بألا تتجاوز 12، وكلما زاد تطلّب رامًا أكثر.",
						en: "The biggest driver of RAM use. Hytale recommends staying at or below 12. The higher it goes, the more RAM you need.",
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
		ar: "اللاعبون",
		en: "Players",
	},
	icon: BridgeIcon.Users,
	sections: [
		{
			layout: BridgeLayout.Table,
			id: "online",
			help: {
				ar: "اللاعبون المتصلون بسيرفرك حاليًا. اطرد أو احظر أيًا منهم.",
				en: "The players on your server right now. Kick or ban any of them.",
			},
			place: BridgePlace.Players,
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
						ar: "اطرد",
						en: "Kick",
					},
					confirm: BridgeConfirm.Normal,
				},
				{
					id: "ban",
					label: {
						ar: "احظر",
						en: "Ban",
					},
					confirm: BridgeConfirm.Normal,
				},
			],
			empty: {
				ar: "لا يوجد لاعبون متصلون حاليًا.",
				en: "Nobody is online right now.",
			},
		},
	],
};

const modsTab: Bridge.Tab = {
	id: "mods",
	title: {
		ar: "المودات",
		en: "Mods",
	},
	icon: BridgeIcon.Puzzle,
	sections: [
		{
			layout: BridgeLayout.Catalog,
			id: "mod-list",
			help: {
				ar: "ثبّت مودات من CurseForge على سيرفرك. لا يظهر أي تثبيت أو إزالة أو إيقاف إلا بعد ريستارت سيرفرك.",
				en: "Install CurseForge mods on your server. Every install, removal or toggle only shows after you restart your server.",
			},
			module: "mods",
			restartHint: true,
			empty: {
				ar: "لا توجد مودات مثبّتة بعد. ابحث عن مود في الأعلى وثبّته. لا يلزم اللاعبين تثبيت أي شيء، فسيرفرك يرسل إليهم المود عند دخولهم.",
				en: "No mods installed yet. Search for one above and install it. Your players install nothing, because your server sends them the mod as they join.",
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
				ar: "تُنفَّذ فورًا على سيرفرك الشغّال.",
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
								ar: "تصل إلى كل اللاعبين المتصلين حاليًا.",
								en: "Reaches everyone who is on the server right now.",
							},
							maxLength: ANNOUNCE_MESSAGE_LENGTH,
						},
					],
				},
			],
		},
		{
			layout: BridgeLayout.Actions,
			id: "whitelist",
			title: {
				ar: "القائمة البيضاء",
				en: "Whitelist",
			},
			help: {
				ar: "عند تفعيلها، لا يدخل سيرفرك إلا اللاعبون الذين تضيفهم بأسماء حساباتهم.",
				en: "Turn it on and only the accounts you add can join your server.",
			},
			place: BridgePlace.Players,
			module: "live",
			actions: [
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
								ar: "عند تفعيلها، لا يدخل إلا اللاعبون الذين أضفتهم.",
								en: "While it's on, only the players you added can join.",
							},
						},
					],
				},
				{
					id: "allow",
					label: {
						ar: "أضف إلى القائمة البيضاء",
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
								ar: "اسم حساب هايتيل كما هو تمامًا، وليس الاسم الظاهر.",
								en: "The exact Hytale account name, not the display name.",
							},
							maxLength: 32,
						},
					],
				},
				{
					id: "disallow",
					label: {
						ar: "أزل من القائمة البيضاء",
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
								ar: "إذا كان اللاعب متصلًا حاليًا، يخرج بعد الريستارت التالي.",
								en: "If the player is online right now, they're out after the next restart.",
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
		accountTab,
		settingsTab,
		playersTab,
		modsTab,
		controlsTab,
	],
};
