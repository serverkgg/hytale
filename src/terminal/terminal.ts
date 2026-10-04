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
			ar: "يعرض كل الأوامر المتاحة، و`/help <أمر>` يشرح أمرًا واحدًا.",
			en: "List every available command. `/help <command>` explains one.",
		},
		syntax: "/help [command]",
	},
	{
		name: "/commands dump",
		summary: {
			ar: "يُصدّر كل أوامر سيرفرك إلى ملف، وهي أدق قائمة لإصدارك.",
			en: "Export every command your server registers to a file. It's the most accurate list for your build.",
		},
	},
	{
		name: "/version",
		summary: {
			ar: "يعرض إصدار سيرفرك بالضبط.",
			en: "Show the exact version your server runs.",
		},
	},
	{
		name: "/who",
		summary: {
			ar: "يعرض اللاعبين المتصلين حاليًا.",
			en: "List the players who are online.",
		},
	},
	{
		name: "/say",
		summary: {
			ar: "رسالة تظهر لكل اللاعبين في كل المابات.",
			en: "Announce a message to everyone, in every world.",
		},
		syntax: "/say <message>",
	},
	{
		name: "/notify",
		summary: {
			ar: "تنبيه صغير يظهر لكل اللاعبين على الشاشة.",
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
			ar: "يعرض إحصائيات تفريغ الرام.",
			en: "Show garbage-collection stats.",
		},
	},
	{
		name: "/server gc",
		summary: {
			ar: "يفرّغ الرام غير المستخدمة، ويفيد عند ارتفاعها فجأة.",
			en: "Free the memory nothing needs any more. Useful when RAM spikes.",
		},
	},
	{
		name: "/server dump",
		summary: {
			ar: "يُصدّر تقريرًا كاملًا عن حالة سيرفرك إلى ملف.",
			en: "Dump a full report of your server's state to a file.",
		},
	},
	{
		name: "/backup",
		summary: {
			ar: "يأخذ لقطة من مابك فورًا، إضافة إلى نسخنا الاحتياطية.",
			en: "Take a snapshot of your world right now, on top of our own backups.",
		},
	},
	{
		name: "/maxplayers",
		summary: {
			ar: "يعرض أقصى عدد للاعبين، و`--amount` يغيّره.",
			en: "Show the maximum player count. `--amount` changes it.",
		},
		syntax: "/maxplayers [--amount <n>]",
	},
	{
		name: "/maxviewradius",
		summary: {
			ar: "يعرض مدى الرؤية للسيرفر كله أو يغيّره، و`reset` يعيده إلى قيمته الأصلية.",
			en: "Show or set the server-wide view distance. `reset` puts it back.",
		},
		syntax: "/maxviewradius [<n>|reset]",
	},
	{
		name: "/maxviewradius reset",
		summary: {
			ar: "يعيد مدى الرؤية للسيرفر كله إلى قيمته الأصلية.",
			en: "Put the server-wide view distance back to its default.",
		},
	},
	{
		name: "/world list",
		summary: {
			ar: "يعرض المابات الموجودة في سيرفرك.",
			en: "List the worlds in your universe.",
		},
	},
	{
		name: "/world save",
		summary: {
			ar: "يحفظ الماب على القرص فورًا، ويتطلب `--confirm`.",
			en: "Write the world to disk right now. It needs `--confirm`.",
		},
		syntax: "/world save [--world <name>|--all] --confirm",
	},
	{
		name: "/world perf",
		summary: {
			ar: "يعرض أداء الماب.",
			en: "Show a world's performance.",
		},
	},
	{
		name: "/world perf reset",
		summary: {
			ar: "ينفّذ ريسيت لإحصائيات أداء الماب ويبدأ القياس من جديد.",
			en: "Reset a world's performance stats and start measuring again.",
		},
	},
	{
		name: "/world tps",
		summary: {
			ar: "يعرض سرعة محاكاة الماب أو يغيّرها، و`reset` يعيدها إلى قيمتها الأصلية.",
			en: "Show or set a world's simulation speed. `reset` puts it back.",
		},
		syntax: "/world tps <rate>",
		danger: true,
	},
	{
		name: "/world tps reset",
		summary: {
			ar: "يعيد سرعة محاكاة الماب إلى قيمتها الأصلية.",
			en: "Put a world's simulation speed back to its default.",
		},
	},
	{
		name: "/world config pvp",
		summary: {
			ar: "يفعّل قتال اللاعبين في الماب أو يوقفه.",
			en: "Turn player-versus-player combat on or off in a world.",
		},
		syntax: "/world config pvp <on|off>",
	},
	{
		name: "/world settings pvp set",
		summary: {
			ar: "يضبط إعداد قتال اللاعبين في الماب.",
			en: "Set the world's PvP setting.",
		},
		syntax: "/world settings pvp set <on|off>",
	},
	{
		name: "/world settings gamemode set",
		summary: {
			ar: "يضبط وضع اللعب الافتراضي للماب.",
			en: "Set the world's default game mode.",
		},
		syntax: "/world settings gamemode set <adventure|creative>",
	},
	{
		name: "/world settings keeploaded set",
		summary: {
			ar: "يحدد هل تبقى الماب محمّلة حتى دون وجود لاعبين فيها.",
			en: "Set whether the world stays loaded even with nobody in it.",
		},
		syntax: "/world settings keeploaded set <on|off>",
	},
	{
		name: "/world remove",
		summary: {
			ar: "يحذف ماب من سيرفرك.",
			en: "Delete a world from your server.",
		},
		syntax: "/world remove <name>",
		danger: true,
	},
	{
		name: "/world prune",
		summary: {
			ar: "يحذف كل المابات الخالية من اللاعبين، باستثناء الماب الأساسية.",
			en: "Delete every non-default world nobody is standing in.",
		},
		danger: true,
	},
	{
		name: "/kick",
		summary: {
			ar: "يطرد لاعبًا من السيرفر.",
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
			ar: "يحظر لاعبًا من السيرفر، و`--reason` يسجّل السبب.",
			en: "Ban a player from the server. `--reason` records why.",
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
			ar: "يوقف القائمة البيضاء.",
			en: "Turn the whitelist off.",
		},
	},
	{
		name: "/whitelist status",
		summary: {
			ar: "يعرض هل القائمة البيضاء مفعّلة أم لا.",
			en: "Show whether the whitelist is on.",
		},
	},
	{
		name: "/whitelist list",
		summary: {
			ar: "يعرض اللاعبين الموجودين في القائمة البيضاء.",
			en: "List the players on the whitelist.",
		},
	},
	{
		name: "/whitelist add",
		summary: {
			ar: "يضيف لاعبًا إلى القائمة البيضاء.",
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
			ar: "يزيل لاعبًا من القائمة البيضاء.",
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
			ar: "يحذف القائمة البيضاء بالكامل.",
			en: "Clear the whole whitelist.",
		},
		danger: true,
	},
	{
		name: "/op add",
		summary: {
			ar: "يعطي لاعبًا صلاحيات أدمن كاملة على سيرفرك.",
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
			ar: "يضيف عقدة صلاحية إلى لاعب.",
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
			ar: "يزيل عقدة صلاحية من لاعب.",
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
			ar: "يعرض عقد الصلاحيات التي يملكها لاعب.",
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
			ar: "يضيف لاعبًا إلى مجموعة صلاحيات.",
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
			ar: "يزيل لاعبًا من مجموعة صلاحيات.",
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
			ar: "يعرض مجموعات الصلاحيات التي ينتمي إليها لاعب.",
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
			ar: "يضيف عقدة صلاحية إلى مجموعة.",
			en: "Add a permission node to a group.",
		},
		syntax: "/perm group add <group> <node>",
		danger: true,
	},
	{
		name: "/perm group remove",
		summary: {
			ar: "يزيل عقدة صلاحية من مجموعة.",
			en: "Remove a permission node from a group.",
		},
		syntax: "/perm group remove <group> <node>",
		danger: true,
	},
	{
		name: "/perm group list",
		summary: {
			ar: "يعرض عقد الصلاحيات الموجودة في مجموعة.",
			en: "List the permission nodes in a group.",
		},
		syntax: "/perm group list <group>",
	},
	{
		name: "/perm test",
		summary: {
			ar: "يختبر عقد الصلاحيات ويعرض النتيجة.",
			en: "Test permission nodes and print the result.",
		},
		syntax: "/perm test <nodes>",
	},
	{
		name: "/plugin list",
		summary: {
			ar: "يعرض المودات والإضافات المحمّلة حاليًا.",
			en: "List the plugins loaded right now.",
		},
	},
	{
		name: "/plugin reload",
		summary: {
			ar: "يعيد تحميل مود وهو شغّال، والريستارت الكامل أكثر أمانًا.",
			en: "Reload a plugin in place. A full restart is safer.",
		},
		syntax: "/plugin reload <name>",
		danger: true,
	},
	{
		name: "/plugin unload",
		summary: {
			ar: "يوقف مودًا شغّالًا دون إيقاف السيرفر.",
			en: "Unload a plugin without stopping the server.",
		},
		syntax: "/plugin unload <name>",
		danger: true,
	},
	{
		name: "/plugin load",
		summary: {
			ar: "يحمّل مودًا جديدًا دون إيقاف السيرفر.",
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
			ar: "يختار حساب تسجيل الدخول الذي يستخدمه سيرفرك.",
			en: "Select which signed-in account your server uses.",
		},
	},
	{
		name: "/auth login device",
		summary: {
			ar: "يبدأ تسجيل الدخول ويُظهر رمز التأكيد ورابطه.",
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
			ar: "يحفظ بيانات الدخول مشفّرة لكي تبقى بعد الريستارت.",
			en: "Store the sign-in encrypted so it survives a restart.",
		},
	},
	{
		name: "/auth cancel",
		summary: {
			ar: "يلغي عملية تسجيل دخول جارية.",
			en: "Cancel a login that is still waiting.",
		},
	},
	{
		name: "/auth logout",
		summary: {
			ar: "يحذف تسجيل دخول سيرفرك.",
			en: "Clear the server's sign-in.",
		},
		danger: true,
	},
	{
		name: "/update status",
		summary: {
			ar: "يعرض إصدار سيرفرك وحالة التحديث.",
			en: "Show the server version and the update state.",
		},
	},
	{
		name: "/update check",
		summary: {
			ar: "يتحقق من هايتيل هل يتوفر إصدار جديد.",
			en: "Ask Hytale whether a newer version shipped.",
		},
	},
	{
		name: "/update download",
		summary: {
			ar: "ينزّل الإصدار الجديد ويجهّزه للتثبيت، و`--force` ينزّله من جديد.",
			en: "Download the new version and stage it. `--force` fetches it again.",
		},
		syntax: "/update download [--force]",
	},
	{
		name: "/update apply --confirm",
		summary: {
			ar: "يثبّت الإصدار المجهّز وينفّذ ريستارت للسيرفر.",
			en: "Apply the staged version and restart the server.",
		},
		danger: true,
	},
	{
		name: "/update cancel",
		summary: {
			ar: "يلغي تنزيلًا أو تثبيتًا جاريًا.",
			en: "Cancel a running download or apply.",
		},
	},
	{
		name: "/update patchline",
		summary: {
			ar: "يعرض قناة التحديثات التي يتابعها سيرفرك أو يغيّرها.",
			en: "Show or set the update channel your server follows.",
		},
		syntax: "/update patchline [name]",
	},
	{
		name: "/update setup",
		summary: {
			ar: "يعيد إنشاء ملفات التشغيل إذا فُقدت أو تلفت.",
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
			ar: "يزيل سيرفرك من قائمة السيرفرات العامة.",
			en: "Take your server off the public discovery listing.",
		},
	},
	{
		name: "/stop",
		summary: {
			ar: "يوقف السيرفر بأمان.",
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
