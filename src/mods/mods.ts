import { type Bridge, BridgeFailureCode, BridgeFailureError, BridgeKind, BridgeUserError } from "@serverkgg/bridge";
import {
	CURSEFORGE_SEARCH_CEILING,
	type CurseforgeCatalog,
	type CurseforgeCatalogOptions,
	type CurseforgeFile,
	CurseforgeSort,
	createCurseforgeCatalog,
	curseforgeDownloadUrl,
	curseforgeSha1,
} from "@serverkgg/bridge/catalogs";
import { readInstallStamp } from "../install";
import { HytaleStage, PATCHLINE, readSection, SERVER_DIRECTORY, stageOf, UPDATE_SECTION } from "../shared";
import { CURSEFORGE_PROVIDER, categoryLabel, categoryName, curseforgeVersionOf, selectFile } from "./modsCurseforge";
import { type ModEntry, type ModsSidecar, readSidecar, writeSidecar } from "./modsSidecar";

const CATALOG_OPTIONS: CurseforgeCatalogOptions = {
	gameId: 70_216,
	searchCacheSeconds: 60,
	projectCacheSeconds: 600,
	categoryCacheSeconds: 86_400,
};

const curseforge = (context: Bridge.Context) => {
	return createCurseforgeCatalog(context, CATALOG_OPTIONS);
};

export const MODS_DIRECTORY = `${SERVER_DIRECTORY}/mods`;

export const DISABLED_SUFFIX = ".disabled";

export const MOD_EXTENSIONS = [
	".zip",
	".jar",
];

const PAGE_SIZE = 20;

const FILE_PAGE_SIZE = 50;

export interface ModFile {
	name: string;
	sizeBytes: number;
}

interface ModTarget {
	stage: HytaleStage;
	gameVersion: string | null;
	patchline: string;
}

export const enabledName = (filename: string) => {
	return filename.endsWith(DISABLED_SUFFIX) ? filename.slice(0, -DISABLED_SUFFIX.length) : filename;
};

export const isModFile = (filename: string) => {
	const name = enabledName(filename).toLowerCase();

	return MOD_EXTENSIONS.some((extension) => name.endsWith(extension));
};

export const coversVersion = (gameVersions: string[], gameVersion: string) => {
	return gameVersions.some((declared) => declared === gameVersion || gameVersion.startsWith(`${declared}.`));
};

export const isStale = (tracked: ModEntry | undefined, gameVersion: string | null) => {
	if (!tracked || !gameVersion || !tracked.installedFor || !tracked.gameVersions?.length) {
		return false;
	}

	if (tracked.installedFor === gameVersion) {
		return false;
	}

	return !coversVersion(tracked.gameVersions, gameVersion);
};

export const needsDownload = (tracked: ModEntry | null, fileId: string) => {
	return tracked === null || tracked.fileId !== fileId;
};

export const refreshedEntry = (tracked: ModEntry, file: CurseforgeFile, gameVersion: string | null): ModEntry => {
	return {
		...tracked,
		gameVersion: curseforgeVersionOf(file, gameVersion),
		gameVersions: file.gameVersions,
		installedFor: gameVersion,
	};
};

export const catalogEntry = (
	file: ModFile,
	tracked: ModEntry | undefined,
	gameVersion: string | null,
): Bridge.CatalogEntry => {
	const name = enabledName(file.name);

	return {
		id: tracked?.id ?? name,
		provider: tracked?.provider ?? null,
		path: `${MODS_DIRECTORY}/${file.name}`,
		title: tracked?.title ?? name,
		version: tracked?.version ?? null,
		sizeBytes: file.sizeBytes,
		enabled: !file.name.endsWith(DISABLED_SUFFIX),
		gameVersion: tracked?.gameVersion ?? null,
		stale: isStale(tracked, gameVersion),
		pageUrl: tracked?.pageUrl ?? null,
		icon: tracked?.icon ?? null,
	};
};

export const mergeInstalled = (
	sidecar: ModsSidecar,
	files: ModFile[],
	gameVersion: string | null,
): Bridge.CatalogEntry[] => {
	return files
		.filter((file) => isModFile(file.name))
		.map((file) => catalogEntry(file, sidecar[enabledName(file.name)], gameVersion));
};

export const trackedNames = (sidecar: ModsSidecar, id: string) => {
	const matched = Object.entries(sidecar)
		.filter(([, entry]) => entry.id === id || entry.projectId === id)
		.map(([filename]) => filename);

	return matched.length > 0 ? matched : Object.keys(sidecar).filter((filename) => filename === enabledName(id));
};

const NOT_READY_NOTE: Bridge.Text = {
	ar: "كتالوج المودات مقفل الحين. لازم الأدمن يضبط مفتاح CurseForge.",
	en: "The mod catalog is off right now. An administrator needs to set the CurseForge key.",
};

const providersOf = (catalog: CurseforgeCatalog): Bridge.CatalogProvider[] => {
	const ready = catalog.ready();

	return [
		{
			id: CURSEFORGE_PROVIDER,
			label: {
				ar: "كيرس فورج",
				en: "CurseForge",
			},
			ready,
			...(ready
				? {}
				: {
						note: NOT_READY_NOTE,
					}),
		},
	];
};

interface SortFacet extends Bridge.CatalogFacet {
	value: CurseforgeSort;
}

const SORTS: SortFacet[] = [
	{
		value: CurseforgeSort.Popularity,
		label: {
			ar: "الأكثر شهرة",
			en: "Most popular",
		},
	},
	{
		value: CurseforgeSort.LastUpdated,
		label: {
			ar: "آخر تحديث",
			en: "Recently updated",
		},
	},
	{
		value: CurseforgeSort.Name,
		label: {
			ar: "الاسم",
			en: "Name",
		},
	},
];

const SORT_BY_VALUE = new Map<string, CurseforgeSort>(
	SORTS.map((facet) => [
		facet.value,
		facet.value,
	]),
);

const sortOf = (value: string | null) => {
	return SORT_BY_VALUE.get(value ?? "") ?? CurseforgeSort.Popularity;
};

const categoryOf = (value: string | null) => {
	const id = Number.parseInt(value ?? "", 10);

	return Number.isSafeInteger(id) ? id : undefined;
};

const categoriesOf = async (context: Bridge.Context, catalog: CurseforgeCatalog): Promise<Bridge.CatalogFacet[]> => {
	try {
		return (await catalog.categories())
			.filter((category) => category.isClass !== true)
			.map((category) => {
				return {
					value: String(category.id),
					label: categoryLabel(category),
				};
			});
	} catch {
		context.log.warn("could not read the curseforge categories for hytale");

		return [];
	}
};

const modTarget = async (context: Bridge.Context): Promise<ModTarget> => {
	const update = await readSection(context, UPDATE_SECTION);
	const patchline = update.Patchline;
	const stamp = await readInstallStamp(context);

	return {
		stage: await stageOf(context),
		gameVersion: stamp?.version ?? null,
		patchline: typeof patchline === "string" && patchline.length > 0 ? patchline : PATCHLINE,
	};
};

const requireServer = (target: ModTarget) => {
	if (target.stage !== HytaleStage.Server) {
		throw new BridgeUserError({
			ar: "لازم تخلّص إعداد سيرفرك أول — سجّل دخوله ونزّل اللعبة، وبعدها تقدر تركّب مودات.",
			en: "Finish setting your server up first — sign it in and download the game, then you can install mods.",
		});
	}
};

let sidecarLock: Promise<unknown> = Promise.resolve();

const exclusive = <Result>(run: () => Promise<Result>): Promise<Result> => {
	const next = sidecarLock.then(run, run);

	sidecarLock = next.catch(() => undefined);

	return next;
};

const forget = async (context: Bridge.Context, sidecar: ModsSidecar, filename: string) => {
	for (const candidate of [
		filename,
		`${filename}${DISABLED_SUFFIX}`,
	]) {
		if (await context.files.exists(`${MODS_DIRECTORY}/${candidate}`)) {
			await context.files.remove(`${MODS_DIRECTORY}/${candidate}`);
		}
	}

	delete sidecar[filename];
};

const listFiles = async (context: Bridge.Context): Promise<ModFile[]> => {
	const entries = await context.files.list(`${MODS_DIRECTORY}/*`);

	return entries
		.filter((entry) => !entry.directory && isModFile(entry.name))
		.map((entry) => {
			return {
				name: entry.name,
				sizeBytes: entry.sizeBytes,
			};
		});
};

const installedName = async (context: Bridge.Context, filename: string) => {
	for (const candidate of [
		filename,
		`${filename}${DISABLED_SUFFIX}`,
	]) {
		if (await context.files.exists(`${MODS_DIRECTORY}/${candidate}`)) {
			return candidate;
		}
	}

	return null;
};

const trackedEntry = (sidecar: ModsSidecar, id: string): ModEntry | null => {
	const filename = trackedNames(sidecar, id).at(0);

	return filename ? (sidecar[filename] ?? null) : null;
};

const installProject = async (context: Bridge.Context, id: string): Promise<Bridge.CatalogEntry> => {
	const target = await modTarget(context);

	requireServer(target);

	const catalog = curseforge(context);
	const details = await catalog.mod(id);
	const files = await catalog.modFiles(id, {
		pageSize: FILE_PAGE_SIZE,
	});
	const file = selectFile(files.data, target.patchline, target.gameVersion);

	if (!file) {
		throw new BridgeFailureError(
			BridgeFailureCode.NoCatalogVersionAvailable,
			`"${details.name}" has no ${target.patchline} build for hytale ${target.gameVersion ?? "this version"}`,
		);
	}

	await context.files.ensure(MODS_DIRECTORY);

	const sidecar = await readSidecar(context, MODS_DIRECTORY);
	const current = trackedEntry(sidecar, id);
	const onDisk =
		current && !needsDownload(current, String(file.id)) ? await installedName(context, current.fileName) : null;

	if (current && onDisk) {
		const refreshed = refreshedEntry(current, file, target.gameVersion);

		sidecar[current.fileName] = refreshed;

		await writeSidecar(context, MODS_DIRECTORY, sidecar);

		context.log("mod already current", {
			provider: CURSEFORGE_PROVIDER,
			title: refreshed.title,
			version: refreshed.version,
			file: refreshed.fileName,
		});

		return catalogEntry(
			{
				name: onDisk,
				sizeBytes: refreshed.sizeBytes,
			},
			refreshed,
			target.gameVersion,
		);
	}

	const url = curseforgeDownloadUrl(file);

	if (!url) {
		throw new BridgeFailureError(
			BridgeFailureCode.CatalogRestricted,
			`"${details.name}" does not allow downloads outside curseforge`,
		);
	}

	for (const filename of trackedNames(sidecar, id)) {
		await forget(context, sidecar, filename);
	}

	const sha1 = curseforgeSha1(file);

	await context.files.download(`${MODS_DIRECTORY}/${file.fileName}`, url, {
		...(sha1 === null
			? {}
			: {
					digest: `sha1:${sha1}`,
				}),
		...(file.fileLength > 0
			? {
					sizeBytes: file.fileLength,
				}
			: {}),
	});

	const entry: ModEntry = {
		id,
		provider: CURSEFORGE_PROVIDER,
		projectId: String(details.id),
		fileId: String(file.id),
		title: details.name,
		version: file.displayName,
		gameVersion: curseforgeVersionOf(file, target.gameVersion),
		gameVersions: file.gameVersions,
		installedFor: target.gameVersion,
		fileName: file.fileName,
		pageUrl: details.links?.websiteUrl ?? null,
		icon: details.logo?.thumbnailUrl ?? null,
		sizeBytes: file.fileLength,
	};

	sidecar[file.fileName] = entry;

	await writeSidecar(context, MODS_DIRECTORY, sidecar);

	context.log("installed a mod", {
		provider: CURSEFORGE_PROVIDER,
		title: entry.title,
		version: entry.version,
		file: entry.fileName,
	});

	return catalogEntry(
		{
			name: entry.fileName,
			sizeBytes: entry.sizeBytes,
		},
		entry,
		target.gameVersion,
	);
};

const removeEntry = async (context: Bridge.Context, id: string) => {
	const sidecar = await readSidecar(context, MODS_DIRECTORY);
	const tracked = trackedNames(sidecar, id);

	if (tracked.length > 0) {
		for (const filename of tracked) {
			await forget(context, sidecar, filename);
		}

		await writeSidecar(context, MODS_DIRECTORY, sidecar);

		return;
	}

	const name = enabledName(id);

	if (!isModFile(name)) {
		throw new BridgeUserError({
			ar: `"${id}" مو مركّب.`,
			en: `"${id}" is not installed.`,
		});
	}

	await forget(context, sidecar, name);
	await writeSidecar(context, MODS_DIRECTORY, sidecar);
};

const toggleEntry = async (context: Bridge.Context, id: string, enabled: boolean) => {
	const sidecar = await readSidecar(context, MODS_DIRECTORY);
	const tracked = trackedNames(sidecar, id);
	const names =
		tracked.length > 0
			? tracked
			: [
					enabledName(id),
				];

	for (const name of names) {
		const active = `${MODS_DIRECTORY}/${name}`;
		const parked = `${active}${DISABLED_SUFFIX}`;

		if (enabled && (await context.files.exists(parked))) {
			await context.files.move(parked, active);
		}

		if (!enabled && (await context.files.exists(active))) {
			await context.files.move(active, parked);
		}
	}
};

export const mods: Bridge.Catalog = {
	kind: BridgeKind.Catalog,
	pageSize: PAGE_SIZE,

	async search(context, query) {
		const catalog = curseforge(context);
		const providers = providersOf(catalog);

		if (!catalog.ready()) {
			return {
				hits: [],
				total: 0,
				providers,
				categories: [],
				sorts: SORTS,
			};
		}

		const facets = {
			providers,
			categories: await categoriesOf(context, catalog),
			sorts: SORTS,
		};

		const index = query.page * PAGE_SIZE;

		if (index + PAGE_SIZE > CURSEFORGE_SEARCH_CEILING) {
			return {
				hits: [],
				total: CURSEFORGE_SEARCH_CEILING,
				...facets,
			};
		}

		const result = await catalog.search({
			query: query.query,
			sort: sortOf(query.sort),
			categoryId: categoryOf(query.category),
			index,
			pageSize: PAGE_SIZE,
		});

		return {
			hits: result.data.map((mod) => {
				return {
					id: String(mod.id),
					provider: CURSEFORGE_PROVIDER,
					title: mod.name,
					description: mod.summary,
					icon: mod.logo?.thumbnailUrl ?? null,
					downloads: mod.downloadCount,
					author: mod.authors.at(0)?.name ?? null,
					categories: mod.categories.map(categoryName),
					updatedAt: mod.dateModified,
					pageUrl: mod.links?.websiteUrl ?? null,
				};
			}),
			total: Math.min(result.pagination.totalCount, CURSEFORGE_SEARCH_CEILING),
			...facets,
		};
	},

	async installed(context) {
		const target = await modTarget(context);

		if (target.stage !== HytaleStage.Server) {
			return [];
		}

		const sidecar = await readSidecar(context, MODS_DIRECTORY);

		return mergeInstalled(sidecar, await listFiles(context), target.gameVersion);
	},

	async install(context, id) {
		return await exclusive(() => installProject(context, id));
	},

	async remove(context, id) {
		await exclusive(() => removeEntry(context, id));
	},

	async toggle(context, id, enabled) {
		await exclusive(() => toggleEntry(context, id, enabled));
	},
};
