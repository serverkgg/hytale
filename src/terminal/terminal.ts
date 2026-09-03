import { type Bridge, BridgeKind, BridgeTerminalLevel } from "@serverkgg/bridge";

const player: Bridge.TerminalArg = {
	key: "player",
	label: {
		ar: "اللاعب",
		en: "Player",
	},
	required: true,
	module: "players",
	column: "username",
};

const commands: Bridge.TerminalCommand[] = [
	{
		name: "/help",
		summary: {
			ar: "يعرض كل الأوامر المتاحة.",
			en: "List every available command.",
		},
	},
	{
		name: "/who",
		summary: {
			ar: "يعرض اللاعبين الداخلين الحين.",
			en: "List the players who are online.",
		},
	},
	{
		name: "/say",
		summary: {
			ar: "رسالة تظهر لكل اللاعبين.",
			en: "Announce a message to everyone.",
		},
		syntax: "/say <message>",
	},
	{
		name: "/auth status",
		summary: {
			ar: "يعرض حالة تسجيل دخول سيرفرك.",
			en: "Show the server's authentication status.",
		},
	},
	{
		name: "/auth login device",
		summary: {
			ar: "يبدأ تسجيل الدخول ويطبع رمز ورابط التأكيد.",
			en: "Start the device login and print the code and verification link.",
		},
	},
	{
		name: "/auth persistence Encrypted",
		summary: {
			ar: "يحفظ بيانات الدخول مشفّرة عشان ما تروح مع إعادة التشغيل.",
			en: "Store the sign-in encrypted so it survives a restart.",
		},
	},
	{
		name: "/auth cancel",
		summary: {
			ar: "يلغي عملية تسجيل دخول شغّالة.",
			en: "Cancel a login that is still waiting.",
		},
	},
	{
		name: "/auth logout",
		summary: {
			ar: "يمسح تسجيل دخول سيرفرك.",
			en: "Clear the server's sign-in.",
		},
		danger: true,
	},
	{
		name: "/update status",
		summary: {
			ar: "يعرض نسخة سيرفرك وحالة التحديث.",
			en: "Show the server version and the update state.",
		},
	},
	{
		name: "/update check",
		summary: {
			ar: "يسأل هايتيل إذا فيه نسخة جديدة.",
			en: "Ask Hytale whether a newer version shipped.",
		},
	},
	{
		name: "/update download",
		summary: {
			ar: "ينزّل النسخة الجديدة ويجهزها للتركيب.",
			en: "Download the new version and stage it.",
		},
	},
	{
		name: "/update apply --confirm",
		summary: {
			ar: "يركّب النسخة المجهّزة ويعيد تشغيل السيرفر.",
			en: "Apply the staged version and restart the server.",
		},
		danger: true,
	},
	{
		name: "/update cancel",
		summary: {
			ar: "يلغي تنزيل أو تركيب شغّال.",
			en: "Cancel a running download or apply.",
		},
	},
	{
		name: "/whitelist enable",
		summary: {
			ar: "يفعّل القائمة البيضاء.",
			en: "Turn the whitelist on.",
		},
	},
	{
		name: "/whitelist disable",
		summary: {
			ar: "يطفّي القائمة البيضاء.",
			en: "Turn the whitelist off.",
		},
	},
	{
		name: "/whitelist add",
		summary: {
			ar: "يضيف لاعب للقائمة البيضاء.",
			en: "Add a player to the whitelist.",
		},
		syntax: "/whitelist add <player>",
		args: [
			player,
		],
	},
	{
		name: "/whitelist remove",
		summary: {
			ar: "يشيل لاعب من القائمة البيضاء.",
			en: "Remove a player from the whitelist.",
		},
		syntax: "/whitelist remove <player>",
		args: [
			player,
		],
	},
	{
		name: "/kick",
		summary: {
			ar: "يطرد لاعب من السيرفر.",
			en: "Kick a player from the server.",
		},
		syntax: "/kick <player>",
		args: [
			player,
		],
	},
	{
		name: "/ban",
		summary: {
			ar: "يحظر لاعب من السيرفر.",
			en: "Ban a player from the server.",
		},
		syntax: "/ban <player>",
		args: [
			player,
		],
		danger: true,
	},
	{
		name: "/maxplayers",
		summary: {
			ar: "يعرض أو يغيّر أقصى عدد لاعبين.",
			en: "Show or set the maximum player count.",
		},
		syntax: "/maxplayers [amount]",
	},
	{
		name: "/tps",
		summary: {
			ar: "يعرض سرعة تحديث العوالم.",
			en: "Show the tick rate of every world.",
		},
	},
	{
		name: "/worlds",
		summary: {
			ar: "يعرض العوالم المحمّلة.",
			en: "List the loaded worlds.",
		},
	},
	{
		name: "/stop",
		summary: {
			ar: "يوقف السيرفر بشكل سليم.",
			en: "Shut the server down cleanly.",
		},
		danger: true,
	},
];

const rules: Bridge.TerminalRule[] = [
	{
		match: /\[\d{4}\/\d{2}\/\d{2}[^\]]*\b(?:ERROR|SEVERE)\s*\]/,
		level: BridgeTerminalLevel.Error,
	},
	{
		match: /\[\d{4}\/\d{2}\/\d{2}[^\]]*\bWARN\w*\s*\]/,
		level: BridgeTerminalLevel.Warn,
	},
	{
		match: /^WARNING: /,
		level: BridgeTerminalLevel.Warn,
	},
	{
		match: /\bException\b|\bOutOfMemoryError\b/,
		level: BridgeTerminalLevel.Error,
	},
];

export const terminal: Bridge.Terminal = {
	kind: BridgeKind.Terminal,
	commands,
	rules,
};
