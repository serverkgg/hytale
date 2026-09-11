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
			ar: "يعرض كل الأوامر المتاحة، و`/help <أمر>` يشرح أمر واحد.",
			en: "List every available command — `/help <command>` explains one.",
		},
		syntax: "/help [command]",
	},
	{
		name: "/commands dump",
		summary: {
			ar: "يطلّع كل أوامر سيرفرك في ملف، وهذي أصدق قائمة لنسختك.",
			en: "Export every command your server registers to a file — the truest list for your build.",
		},
	},
	{
		name: "/version",
		summary: {
			ar: "يعرض نسخة سيرفرك بالضبط.",
			en: "Show the exact version your server runs.",
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
			ar: "رسالة تظهر لكل اللاعبين في كل العوالم.",
			en: "Announce a message to everyone, in every world.",
		},
		syntax: "/say <message>",
	},
	{
		name: "/notify",
		summary: {
			ar: "تنبيه صغير يطلع لكل اللاعبين على الشاشة.",
			en: "Pop a small on-screen notification for every player.",
		},
		syntax: "/notify <message>",
	},
	{
		name: "/server stats",
		summary: {
			ar: "يعرض استهلاك الرام والمعالج على سيرفرك.",
			en: "Show how much RAM and CPU your server is using.",
		},
	},
	{
		name: "/server stats cpu",
		summary: {
			ar: "يعرض استهلاك المعالج وحده.",
			en: "Show CPU usage on its own.",
		},
	},
	{
		name: "/server stats memory",
		summary: {
			ar: "يعرض استهلاك الرام وحده.",
			en: "Show RAM usage on its own.",
		},
	},
	{
		name: "/server stats gc",
		summary: {
			ar: "يعرض إحصائيات تفضية الرام.",
			en: "Show garbage-collection stats.",
		},
	},
	{
		name: "/server gc",
		summary: {
			ar: "يفضّي الرام اللي ما عاد لها داعي. يفيد لما ترتفع فجأة.",
			en: "Free the memory nothing needs any more — useful when RAM spikes.",
		},
	},
	{
		name: "/server dump",
		summary: {
			ar: "يطلّع تقرير كامل عن حالة سيرفرك في ملف.",
			en: "Dump a full report of your server's state to a file.",
		},
	},
	{
		name: "/backup",
		summary: {
			ar: "ياخذ نسخة من عالمك على طول، زيادة على نسخنا الاحتياطية.",
			en: "Take a snapshot of your world right now, on top of our own backups.",
		},
	},
	{
		name: "/maxplayers",
		summary: {
			ar: "يعرض أقصى عدد لاعبين، و`--amount` يغيّره.",
			en: "Show the maximum player count — `--amount` changes it.",
		},
		syntax: "/maxplayers [--amount <n>]",
	},
	{
		name: "/maxviewradius",
		summary: {
			ar: "يعرض أو يغيّر مدى الرؤية لكل السيرفر، و`reset` يرجّعه للأصل.",
			en: "Show or set the server-wide view distance — `reset` puts it back.",
		},
		syntax: "/maxviewradius [<n>|reset]",
	},
	{
		name: "/maxviewradius reset",
		summary: {
			ar: "يرجّع مدى الرؤية لكل السيرفر لقيمته الأصلية.",
			en: "Put the server-wide view distance back to its default.",
		},
	},
	{
		name: "/world list",
		summary: {
			ar: "يعرض العوالم اللي في سيرفرك.",
			en: "List the worlds in your universe.",
		},
	},
	{
		name: "/world save",
		summary: {
			ar: "يحفظ العالم على القرص على طول، ولازم `--confirm` معه.",
			en: "Write the world to disk right now — it needs `--confirm`.",
		},
		syntax: "/world save [--world <name>|--all] --confirm",
	},
	{
		name: "/world perf",
		summary: {
			ar: "يعرض أداء العالم.",
			en: "Show a world's performance.",
		},
	},
	{
		name: "/world perf reset",
		summary: {
			ar: "يصفّر إحصائيات أداء العالم ويبدأ القياس من جديد.",
			en: "Reset a world's performance stats and start measuring again.",
		},
	},
	{
		name: "/world tps",
		summary: {
			ar: "يعرض أو يغيّر سرعة محاكاة العالم، و`reset` يرجّعها للأصل.",
			en: "Show or set a world's simulation speed — `reset` puts it back.",
		},
		syntax: "/world tps <rate>",
		danger: true,
	},
	{
		name: "/world tps reset",
		summary: {
			ar: "يرجّع سرعة محاكاة العالم لقيمتها الأصلية.",
			en: "Put a world's simulation speed back to its default.",
		},
	},
	{
		name: "/world config pvp",
		summary: {
			ar: "يفعّل أو يطفّي قتال اللاعبين في العالم.",
			en: "Turn player-versus-player combat on or off in a world.",
		},
		syntax: "/world config pvp <on|off>",
	},
	{
		name: "/world settings pvp set",
		summary: {
			ar: "يضبط إعداد قتال اللاعبين للعالم.",
			en: "Set the world's PvP setting.",
		},
		syntax: "/world settings pvp set <on|off>",
	},
	{
		name: "/world settings gamemode set",
		summary: {
			ar: "يضبط وضع اللعب الافتراضي للعالم.",
			en: "Set the world's default game mode.",
		},
		syntax: "/world settings gamemode set <adventure|creative>",
	},
	{
		name: "/world settings keeploaded set",
		summary: {
			ar: "يضبط إذا كان العالم يبقى محمّل حتى بدون لاعبين فيه.",
			en: "Set whether the world stays loaded even with nobody in it.",
		},
		syntax: "/world settings keeploaded set <on|off>",
	},
	{
		name: "/world remove",
		summary: {
			ar: "يحذف عالم من سيرفرك.",
			en: "Delete a world from your server.",
		},
		syntax: "/world remove <name>",
		danger: true,
	},
	{
		name: "/world prune",
		summary: {
			ar: "يحذف كل العوالم اللي ما فيها أحد ومو العالم الأساسي.",
			en: "Delete every non-default world nobody is standing in.",
		},
		danger: true,
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
			ar: "يحظر لاعب من السيرفر، و`--reason` يكتب السبب.",
			en: "Ban a player from the server — `--reason` records why.",
		},
		syntax: "/ban <player> [--reason <text>]",
		args: [
			player,
		],
		danger: true,
	},
	{
		name: "/unban",
		summary: {
			ar: "يفك الحظر عن لاعب.",
			en: "Lift a ban off a player.",
		},
		syntax: "/unban <player>",
		args: [
			player,
		],
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
		name: "/whitelist status",
		summary: {
			ar: "يعرض إذا كانت القائمة البيضاء شغّالة أو لا.",
			en: "Show whether the whitelist is on.",
		},
	},
	{
		name: "/whitelist list",
		summary: {
			ar: "يعرض اللاعبين اللي في القائمة البيضاء.",
			en: "List the players on the whitelist.",
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
		name: "/whitelist clear",
		summary: {
			ar: "يمسح القائمة البيضاء كاملة.",
			en: "Wipe the whole whitelist.",
		},
		danger: true,
	},
	{
		name: "/op add",
		summary: {
			ar: "يعطي لاعب صلاحيات أدمن كاملة على سيرفرك.",
			en: "Give a player full admin powers on your server.",
		},
		syntax: "/op add <player>",
		args: [
			player,
		],
		danger: true,
	},
	{
		name: "/op remove",
		summary: {
			ar: "يسحب صلاحيات الأدمن من لاعب.",
			en: "Take a player's admin powers away.",
		},
		syntax: "/op remove <player>",
		args: [
			player,
		],
		danger: true,
	},
	{
		name: "/perm list",
		summary: {
			ar: "يعرض كل عقد الصلاحيات المسجّلة.",
			en: "List every registered permission node.",
		},
	},
	{
		name: "/perm reload",
		summary: {
			ar: "يعيد تحميل ملفات الصلاحيات من القرص.",
			en: "Reload the permission files from disk.",
		},
		danger: true,
	},
	{
		name: "/perm user",
		summary: {
			ar: "يدير صلاحيات لاعب واحد.",
			en: "Manage one player's permissions.",
		},
		syntax: "/perm user <player> …",
	},
	{
		name: "/perm user add",
		summary: {
			ar: "يضيف عقدة صلاحية للاعب.",
			en: "Add a permission node to a player.",
		},
		syntax: "/perm user add <player> <node>",
		args: [
			player,
		],
		danger: true,
	},
	{
		name: "/perm user remove",
		summary: {
			ar: "يشيل عقدة صلاحية من لاعب.",
			en: "Remove a permission node from a player.",
		},
		syntax: "/perm user remove <player> <node>",
		args: [
			player,
		],
		danger: true,
	},
	{
		name: "/perm user list",
		summary: {
			ar: "يعرض عقد الصلاحيات اللي عند لاعب.",
			en: "List the permission nodes a player has.",
		},
		syntax: "/perm user list <player>",
		args: [
			player,
		],
	},
	{
		name: "/perm user group add",
		summary: {
			ar: "يضيف لاعب لمجموعة صلاحيات.",
			en: "Add a player to a permission group.",
		},
		syntax: "/perm user group add <player> <group>",
		args: [
			player,
		],
		danger: true,
	},
	{
		name: "/perm user group remove",
		summary: {
			ar: "يشيل لاعب من مجموعة صلاحيات.",
			en: "Remove a player from a permission group.",
		},
		syntax: "/perm user group remove <player> <group>",
		args: [
			player,
		],
		danger: true,
	},
	{
		name: "/perm user group list",
		summary: {
			ar: "يعرض مجموعات الصلاحيات اللي عليها لاعب.",
			en: "List the permission groups a player belongs to.",
		},
		syntax: "/perm user group list <player>",
		args: [
			player,
		],
	},
	{
		name: "/perm group",
		summary: {
			ar: "يدير مجموعات الصلاحيات.",
			en: "Manage the permission groups.",
		},
		syntax: "/perm group <name> …",
	},
	{
		name: "/perm group add",
		summary: {
			ar: "يضيف عقدة صلاحية لمجموعة.",
			en: "Add a permission node to a group.",
		},
		syntax: "/perm group add <group> <node>",
		danger: true,
	},
	{
		name: "/perm group remove",
		summary: {
			ar: "يشيل عقدة صلاحية من مجموعة.",
			en: "Remove a permission node from a group.",
		},
		syntax: "/perm group remove <group> <node>",
		danger: true,
	},
	{
		name: "/perm group list",
		summary: {
			ar: "يعرض عقد الصلاحيات اللي في مجموعة.",
			en: "List the permission nodes in a group.",
		},
		syntax: "/perm group list <group>",
	},
	{
		name: "/perm test",
		summary: {
			ar: "يختبر صلاحيات ويقول لك النتيجة.",
			en: "Test permission nodes and print the result.",
		},
		syntax: "/perm test <nodes>",
	},
	{
		name: "/plugin list",
		summary: {
			ar: "يعرض المودات والإضافات اللي محمّلة الحين.",
			en: "List the plugins loaded right now.",
		},
	},
	{
		name: "/plugin reload",
		summary: {
			ar: "يعيد تحميل مود وهو شغّال. أضمن لك تعيد تشغيل السيرفر.",
			en: "Reload a plugin in place — a full restart is safer.",
		},
		syntax: "/plugin reload <name>",
		danger: true,
	},
	{
		name: "/plugin unload",
		summary: {
			ar: "يطفّي مود وهو شغّال بدون ما توقف السيرفر.",
			en: "Unload a plugin without stopping the server.",
		},
		syntax: "/plugin unload <name>",
		danger: true,
	},
	{
		name: "/plugin load",
		summary: {
			ar: "يحمّل مود جديد وهو شغّال بدون ما توقف السيرفر.",
			en: "Load a new plugin without stopping the server.",
		},
		syntax: "/plugin load <name>",
		danger: true,
	},
	{
		name: "/packs list",
		summary: {
			ar: "يعرض حزم الأصول المحمّلة على سيرفرك.",
			en: "List the asset packs your server loaded.",
		},
	},
	{
		name: "/auth status",
		summary: {
			ar: "يعرض حالة تسجيل دخول سيرفرك.",
			en: "Show the server's authentication status.",
		},
	},
	{
		name: "/auth select",
		summary: {
			ar: "يختار حساب تسجيل الدخول اللي يستخدمه سيرفرك.",
			en: "Select which signed-in account your server uses.",
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
		name: "/auth login browser",
		summary: {
			ar: "يبدأ تسجيل الدخول عن طريق المتصفح بدل الرمز.",
			en: "Start the sign-in through a browser instead of a code.",
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
			ar: "ينزّل النسخة الجديدة ويجهزها للتركيب، و`--force` ينزّلها من جديد.",
			en: "Download the new version and stage it — `--force` fetches it again.",
		},
		syntax: "/update download [--force]",
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
		name: "/update patchline",
		summary: {
			ar: "يعرض أو يغيّر قناة التحديثات اللي يتابعها سيرفرك.",
			en: "Show or set the update channel your server follows.",
		},
		syntax: "/update patchline [name]",
	},
	{
		name: "/update setup",
		summary: {
			ar: "يطلّع ملفات التشغيل من جديد إذا راحت أو تخربطت.",
			en: "Write the start scripts back out if they went missing.",
		},
		syntax: "/update setup [--force]",
	},
	{
		name: "/discovery link",
		summary: {
			ar: "يربط سيرفرك بقائمة السيرفرات العامة في هايتيل.",
			en: "List your server on Hytale's public server discovery.",
		},
		syntax: "/discovery link <token>",
	},
	{
		name: "/discovery unlink",
		summary: {
			ar: "يشيل سيرفرك من قائمة السيرفرات العامة.",
			en: "Take your server off the public discovery listing.",
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
		match: /^Caused by: /,
		level: BridgeTerminalLevel.Error,
	},
	{
		match: /^\s*at [\w.$/]+\(/,
		level: BridgeTerminalLevel.Error,
	},
	{
		match: /^\s*\.\.\. \d+ more/,
		level: BridgeTerminalLevel.Error,
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
