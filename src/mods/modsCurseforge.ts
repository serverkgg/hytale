import {
	type Bridge,
	BridgeFailureCode,
	BridgeFailureError,
	BridgeNetError,
	BridgeSecretError,
} from "@serverkgg/bridge";
import { PATCHLINE } from "../shared";

export const CURSEFORGE = "https://api.curseforge.com/v1";

export const CURSEFORGE_CDN_SUFFIX = ".forgecdn.net";

export const CURSEFORGE_SECRET = "CURSEFORGE_API_KEY";

export const CURSEFORGE_PROVIDER = "curseforge";

export const CURSEFORGE_GAME_ID = 70_216;

export const CURSEFORGE_SHA1 = 1;

export const CURSEFORGE_RELEASE = 1;

export const CURSEFORGE_SEARCH_CEILING = 10_000;

export const SEARCH_CACHE_SECONDS = 60;

export const PROJECT_CACHE_SECONDS = 600;

export const CATEGORY_CACHE_SECONDS = 86_400;

export const SORT_POPULARITY = "2";

export const SORT_UPDATED = "3";

export const SORT_NAME = "4";

const REJECTED_STATUSES = [
	401,
	403,
];

const THROTTLED_STATUSES = [
	429,
	503,
];

export interface CurseAuthor {
	name: string;
}

export interface CurseCategory {
	id: number;
	name: string;
	isClass?: boolean | null;
}

export interface CurseCategories {
	data: CurseCategory[];
}

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

export const categoryLabel = (category: CurseCategory): Bridge.Text => {
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

export const categoryName = (category: CurseCategory) => {
	return categoryLabel(category).en;
};

export interface CurseMod {
	id: number;
	name: string;
	slug: string;
	summary: string;
	downloadCount: number;
	authors: CurseAuthor[];
	categories: CurseCategory[];
	dateModified: string | null;
	allowModDistribution: boolean | null;
	logo: {
		thumbnailUrl: string | null;
	} | null;
	links: {
		websiteUrl: string | null;
	} | null;
}

export interface CursePagination {
	totalCount: number;
}

export interface CurseSearch {
	data: CurseMod[];
	pagination: CursePagination;
}

export interface CurseSingle {
	data: CurseMod;
}

export interface CurseHash {
	value: string;
	algo: number;
}

export interface CurseFileEntry {
	id: number;
	modId: number;
	fileName: string;
	displayName: string;
	downloadUrl: string | null;
	fileLength: number;
	fileDate: string | null;
	isAvailable: boolean;
	releaseType: number;
	gameVersions: string[];
	hashes: CurseHash[];
}

export interface CurseFiles {
	data: CurseFileEntry[];
}

export const curseforgeReady = (context: Bridge.Context) => {
	return context.secret(CURSEFORGE_SECRET) !== null;
};

export const curseforgeRequest = async <Result>(
	context: Bridge.Context,
	url: string,
	cacheSeconds = PROJECT_CACHE_SECONDS,
): Promise<Result> => {
	const key = context.secret(CURSEFORGE_SECRET);

	if (!key) {
		throw new BridgeSecretError(CURSEFORGE_SECRET, "curseforge needs an api key before it can be searched");
	}

	try {
		return await context.net.json<Result>(url, {
			headers: {
				"x-api-key": key,
			},
			cacheSeconds,
		});
	} catch (error) {
		if (!(error instanceof BridgeNetError) || error.status === null) {
			throw error;
		}

		if (REJECTED_STATUSES.includes(error.status)) {
			throw new BridgeSecretError(CURSEFORGE_SECRET, `curseforge rejected the configured key — ${error.message}`);
		}

		if (THROTTLED_STATUSES.includes(error.status)) {
			throw new BridgeFailureError(
				BridgeFailureCode.CatalogRateLimited,
				"curseforge asked us to slow down, wait a moment and try again",
			);
		}

		throw error;
	}
};

export const curseforgeSha1 = (entry: CurseFileEntry) => {
	return entry.hashes.find((hash) => hash.algo === CURSEFORGE_SHA1)?.value.toLowerCase() ?? null;
};

export const curseforgeDownloadUrl = (entry: CurseFileEntry): string | null => {
	if (!entry.downloadUrl || !URL.canParse(entry.downloadUrl)) {
		return null;
	}

	const remote = new URL(entry.downloadUrl);

	if (remote.protocol !== "https:" || !remote.hostname.endsWith(CURSEFORGE_CDN_SUFFIX)) {
		return null;
	}

	return `${remote.origin}${remote.pathname
		.split("/")
		.map((segment) => encodeURIComponent(decodeURIComponent(segment)))
		.join("/")}`;
};

export const curseforgeVersionOf = (entry: CurseFileEntry, gameVersion: string | null) => {
	if (gameVersion && entry.gameVersions.includes(gameVersion)) {
		return gameVersion;
	}

	return entry.gameVersions.at(0) ?? null;
};

const newest = (files: CurseFileEntry[]) => {
	return [
		...files,
	].sort((left, right) => right.id - left.id);
};

export const selectFile = (
	files: CurseFileEntry[],
	patchline: string,
	gameVersion: string | null,
): CurseFileEntry | null => {
	const usable = newest(files.filter((entry) => entry.isAvailable));

	const channelled =
		patchline.toLowerCase() === PATCHLINE ? usable.filter((entry) => entry.releaseType === CURSEFORGE_RELEASE) : usable;

	if (channelled.length === 0) {
		return null;
	}

	if (!gameVersion) {
		return channelled.at(0) ?? null;
	}

	return channelled.find((entry) => entry.gameVersions.includes(gameVersion)) ?? channelled.at(0) ?? null;
};
