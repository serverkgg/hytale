import type { Bridge } from "@serverkgg/bridge";
import { type CurseforgeCategory, type CurseforgeFile, CurseforgeReleaseType } from "@serverkgg/bridge/catalogs";
import type { BridgeCatalogRelease } from "@serverkgg/bridge/protocol";
import { PATCHLINE } from "../shared";

export const CURSEFORGE_PROVIDER = "curseforge";

const CATEGORY_HIERARCHY = /\s*\\\s*/g;

export const CATEGORY_LABELS: Record<string, Bridge.Text> = {
	"9189": {
		ar: "بلوكات زرقاء",
		en: "Blue Blocks",
	},
	"9211": {
		ar: "أثاث",
		en: "Furniture",
	},
	"9212": {
		ar: "أسلوب اللعب",
		en: "Gameplay",
	},
	"9213": {
		ar: "تسهيلات",
		en: "Quality of Life",
	},
	"9214": {
		ar: "باركور",
		en: "Parkour",
	},
	"9282": {
		ar: "إضافات مبكرة",
		en: "Early Plugins",
	},
	"9283": {
		ar: "مخلوقات وشخصيات",
		en: "Mobs & Characters",
	},
	"9285": {
		ar: "بلوكات",
		en: "Blocks",
	},
	"9286": {
		ar: "توليد العوالم",
		en: "World Gen",
	},
	"9287": {
		ar: "مباني جاهزة",
		en: "Prefab",
	},
	"9288": {
		ar: "أكل وزراعة",
		en: "Food & Farming",
	},
	"9289": {
		ar: "أدوات",
		en: "Utility",
	},
	"9290": {
		ar: "متنوّع",
		en: "Miscellaneous",
	},
	"9297": {
		ar: "مكتبات",
		en: "Library",
	},
	"9312": {
		ar: "مغامرات",
		en: "Adventure",
	},
	"9313": {
		ar: "سيرفايفل",
		en: "Survival",
	},
	"9314": {
		ar: "ألعاب مصغّرة",
		en: "Minigames",
	},
	"10360": {
		ar: "ترجمات",
		en: "Translations",
	},
	"10425": {
		ar: "حزم موارد",
		en: "Resource Packs",
	},
	"10466": {
		ar: "مظاهر ودروع",
		en: "Cosmetics & Armor",
	},
	"10684": {
		ar: "ألعاب مصغّرة",
		en: "Minigames",
	},
	"10794": {
		ar: 'نهائيات "New Worlds"',
		en: '"New Worlds" Finalists',
	},
};

export const cleanCategoryName = (name: string) => {
	return name.replace(CATEGORY_HIERARCHY, " & ").trim();
};

export const categoryLabel = (category: CurseforgeCategory): Bridge.Text => {
	const known = CATEGORY_LABELS[String(category.id)];

	if (known) {
		return known;
	}

	const cleaned = cleanCategoryName(category.name);

	return {
		ar: cleaned,
		en: cleaned,
	};
};

export const categoryName = (category: CurseforgeCategory) => {
	return categoryLabel(category).en;
};

export const curseforgeVersionOf = (file: CurseforgeFile, gameVersion: string | null) => {
	if (gameVersion && file.gameVersions.includes(gameVersion)) {
		return gameVersion;
	}

	return file.gameVersions.at(0) ?? null;
};

const newest = (files: CurseforgeFile[]) => {
	return [
		...files,
	].sort((left, right) => right.id - left.id);
};

export const isChannelled = (file: CurseforgeFile, patchline: string) => {
	if (!file.isAvailable) {
		return false;
	}

	return patchline.toLowerCase() !== PATCHLINE || file.releaseType === CurseforgeReleaseType.Release;
};

export const channelledFiles = (files: CurseforgeFile[], patchline: string) => {
	return newest(files.filter((file) => isChannelled(file, patchline)));
};

export const selectFile = (
	files: CurseforgeFile[],
	patchline: string,
	gameVersion: string | null,
): CurseforgeFile | null => {
	const channelled = channelledFiles(files, patchline);

	if (channelled.length === 0) {
		return null;
	}

	if (!gameVersion) {
		return channelled.at(0) ?? null;
	}

	return channelled.find((file) => file.gameVersions.includes(gameVersion)) ?? channelled.at(0) ?? null;
};

export const releasesOf = (
	files: CurseforgeFile[],
	patchline: string,
	gameVersion: string | null,
): BridgeCatalogRelease[] => {
	return channelledFiles(files, patchline).map((file) => {
		const declared = curseforgeVersionOf(file, gameVersion);

		return {
			id: String(file.id),
			label: file.displayName,
			...(declared === null
				? {}
				: {
						gameVersion: declared,
					}),
		};
	});
};
