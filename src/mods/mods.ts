import { type Bridge, BridgeFailureCode, BridgeFailureError, BridgeKind, BridgeUserError } from "@serverkgg/bridge";
import { readStamp } from "../install";
import { HytaleStage, PATCHLINE, readSection, SERVER_DIRECTORY, stageOf, UPDATE_SECTION } from "../shared";
import {
	CATEGORY_CACHE_SECONDS,
	CURSEFORGE,
	CURSEFORGE_GAME_ID,
	CURSEFORGE_PROVIDER,
	CURSEFORGE_SEARCH_CEILING,
	type CurseCategories,
	type CurseFileEntry,
	type CurseFiles,
	type CurseSearch,
	type CurseSingle,
	categoryLabel,
	categoryName,
	curseforgeDownloadUrl,
	curseforgeReady,
	curseforgeRequest,
	curseforgeSha1,
	curseforgeVersionOf,
	PROJECT_CACHE_SECONDS,
	SEARCH_CACHE_SECONDS,
	SORT_NAME,
	SORT_POPULARITY,
	SORT_UPDATED,
	selectFile,
} from "./modsCurseforge";
import { type ModEntry, type ModsSidecar, readSidecar, writeSidecar } from "./modsSidecar";

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

export const refreshedEntry = (tracked: ModEntry, file: CurseFileEntry, gameVersion: string | null): ModEntry => {
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

const providersOf = (context: Bridge.Context): Bridge.CatalogProvider[] => {
	const ready = curseforgeReady(context);

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

const SORTS: Bridge.CatalogFacet[] = [
	{
		value: SORT_POPULARITY,
		label: {
			ar: "الأكثر شهرة",
			en: "Most popular",
		},
	},
	{
		value: SORT_UPDATED,
		label: {
			ar: "آخر تحديث",
			en: "Recently updated",
		},
	},
	{
		value: SORT_NAME,
		label: {
			ar: "الاسم",
			en: "Name",
		},
	},
];

const categoriesOf = async (context: Bridge.Context): Promise<Bridge.CatalogFacet[]> => {
	try {
		const result = await curseforgeRequest<CurseCategories>(
			context,
			`${CURSEFORGE}/categories?gameId=${CURSEFORGE_GAME_ID}`,
			CATEGORY_CACHE_SECONDS,
		);

		return result.data
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
	const stamp = await readStamp(context);

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

	const project = encodeURIComponent(id);
	const details = await curseforgeRequest<CurseSingle>(context, `${CURSEFORGE}/mods/${project}`);
	const files = await curseforgeRequest<CurseFiles>(
		context,
		`${CURSEFORGE}/mods/${project}/files?pageSize=${FILE_PAGE_SIZE}`,
		PROJECT_CACHE_SECONDS,
	);
	const file = selectFile(files.data, target.patchline, target.gameVersion);

	if (!file) {
		throw new BridgeFailureError(
			BridgeFailureCode.NoCatalogVersionAvailable,
			`"${details.data.name}" has no ${target.patchline} build for hytale ${target.gameVersion ?? "this version"}`,
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
			`"${details.data.name}" does not allow downloads outside curseforge`,
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
		projectId: String(details.data.id),
		fileId: String(file.id),
		title: details.data.name,
		version: file.displayName,
		gameVersion: curseforgeVersionOf(file, target.gameVersion),
		gameVersions: file.gameVersions,
		installedFor: target.gameVersion,
		fileName: file.fileName,
		pageUrl: details.data.links?.websiteUrl ?? null,
		icon: details.data.logo?.thumbnailUrl ?? null,
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
		const providers = providersOf(context);

		if (!curseforgeReady(context)) {
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
			categories: await categoriesOf(context),
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

		const sort = query.sort ?? SORT_POPULARITY;
		const url = new URL(`${CURSEFORGE}/mods/search`);

		url.searchParams.set("gameId", String(CURSEFORGE_GAME_ID));
		url.searchParams.set("searchFilter", query.query);
		url.searchParams.set("sortField", sort);
		url.searchParams.set("sortOrder", sort === SORT_NAME ? "asc" : "desc");
		url.searchParams.set("index", String(index));
		url.searchParams.set("pageSize", String(PAGE_SIZE));

		if (query.category) {
			url.searchParams.set("categoryId", query.category);
		}

		const result = await curseforgeRequest<CurseSearch>(context, url.toString(), SEARCH_CACHE_SECONDS);

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
