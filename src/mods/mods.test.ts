import { describe, expect, test } from "bun:test";
import {
	type Bridge,
	BridgeAction,
	BridgeConfirm,
	BridgeNetError,
	BridgeUserError,
	isReadAction,
} from "@serverkgg/bridge";
import { CURSEFORGE_API, type CurseforgeFile, CurseforgeReleaseType } from "@serverkgg/bridge/catalogs";
import { INSTALL_STAMP_FILE } from "@serverkgg/bridge/install";
import { PAYLOAD_FILES } from "../shared";
import {
	catalogEntry,
	coversVersion,
	isStale,
	MODS_DIRECTORY,
	mergeInstalled,
	mods,
	needsDownload,
	refreshedEntry,
	trackedNames,
} from "./mods";
import { CATEGORY_LABELS, categoryLabel, categoryName, releasesOf, selectFile } from "./modsCurseforge";
import type { ModEntry, ModsSidecar } from "./modsSidecar";

const file = (over: Partial<CurseforgeFile>): CurseforgeFile => {
	return {
		id: 1,
		modId: 918_273,
		fileName: "mod.jar",
		displayName: "mod 1.0.0",
		downloadUrl: "https://edge.forgecdn.net/files/5544/332/mod.jar",
		fileLength: 2048,
		fileDate: null,
		isAvailable: true,
		releaseType: CurseforgeReleaseType.Release,
		gameVersions: [
			"0.6.3",
		],
		hashes: [],
		dependencies: [],
		...over,
	};
};

const tracked: ModEntry = {
	id: "918273",
	provider: "curseforge",
	projectId: "918273",
	fileId: "5544332",
	title: "HeroCore API",
	version: "HeroCore 1.4.2",
	gameVersion: "0.6.3",
	gameVersions: [
		"0.6.3",
	],
	installedFor: "0.6.3",
	fileName: "HeroCore-1.4.2.jar",
	pageUrl: "https://www.curseforge.com/hytale/mods/herocore-api",
	icon: null,
	sizeBytes: 2048,
};

const legacy: ModEntry = {
	id: "918273",
	provider: "curseforge",
	projectId: "918273",
	fileId: "5544332",
	title: "HeroCore API",
	version: "HeroCore 1.4.2",
	gameVersion: "0.6.3",
	fileName: "HeroCore-1.4.2.jar",
	pageUrl: "https://www.curseforge.com/hytale/mods/herocore-api",
	icon: null,
	sizeBytes: 2048,
};

const sidecar: ModsSidecar = {
	[tracked.fileName]: tracked,
};

describe("picking the file to install", () => {
	test("on the release patchline it never installs a beta or an alpha build", () => {
		expect(
			selectFile(
				[
					file({
						id: 9,
						releaseType: CurseforgeReleaseType.Beta,
						fileName: "beta.jar",
					}),
					file({
						id: 5,
						releaseType: CurseforgeReleaseType.Release,
						fileName: "release.jar",
					}),
				],
				"release",
				"0.6.3",
			)?.fileName,
		).toBe("release.jar");
	});

	test("on any other patchline it takes the newest build whatever its channel", () => {
		expect(
			selectFile(
				[
					file({
						id: 9,
						releaseType: CurseforgeReleaseType.Beta,
						fileName: "beta.jar",
					}),
					file({
						id: 5,
						releaseType: CurseforgeReleaseType.Release,
						fileName: "release.jar",
					}),
				],
				"pre-release",
				"0.6.3",
			)?.fileName,
		).toBe("beta.jar");
	});

	test("prefers the build made for the version this server runs", () => {
		expect(
			selectFile(
				[
					file({
						id: 9,
						fileName: "for-0.7.0.jar",
						gameVersions: [
							"0.7.0",
						],
					}),
					file({
						id: 5,
						fileName: "for-0.6.3.jar",
						gameVersions: [
							"0.6.3",
						],
					}),
				],
				"release",
				"0.6.3",
			)?.fileName,
		).toBe("for-0.6.3.jar");
	});

	test("falls back to the newest build when nothing declares this version", () => {
		expect(
			selectFile(
				[
					file({
						id: 5,
						fileName: "old.jar",
						gameVersions: [
							"0.5.0",
						],
					}),
					file({
						id: 9,
						fileName: "new.jar",
						gameVersions: [
							"0.7.0",
						],
					}),
				],
				"release",
				"0.6.3",
			)?.fileName,
		).toBe("new.jar");
	});

	test("takes the newest build when we do not know which version is installed", () => {
		expect(
			selectFile(
				[
					file({
						id: 5,
						fileName: "old.jar",
					}),
					file({
						id: 9,
						fileName: "new.jar",
					}),
				],
				"release",
				null,
			)?.fileName,
		).toBe("new.jar");
	});

	test("skips a file curseforge marks unavailable", () => {
		expect(
			selectFile(
				[
					file({
						id: 9,
						fileName: "pulled.jar",
						isAvailable: false,
					}),
					file({
						id: 5,
						fileName: "kept.jar",
					}),
				],
				"release",
				"0.6.3",
			)?.fileName,
		).toBe("kept.jar");
	});

	test("has nothing to install when the release channel holds no build", () => {
		expect(
			selectFile(
				[
					file({
						releaseType: CurseforgeReleaseType.Alpha,
					}),
				],
				"release",
				"0.6.3",
			),
		).toBeNull();
	});
});

describe("listing what is installed", () => {
	test("shows a mod the catalog installed with everything it recorded", () => {
		expect(
			mergeInstalled(
				sidecar,
				[
					{
						name: tracked.fileName,
						sizeBytes: 2048,
					},
				],
				"0.6.3",
			),
		).toEqual([
			{
				id: "918273",
				provider: "curseforge",
				path: `${MODS_DIRECTORY}/HeroCore-1.4.2.jar`,
				title: "HeroCore API",
				version: "HeroCore 1.4.2",
				sizeBytes: 2048,
				enabled: true,
				gameVersion: "0.6.3",
				stale: false,
				pageUrl: "https://www.curseforge.com/hytale/mods/herocore-api",
				icon: null,
			},
		]);
	});

	test("shows a file the customer uploaded themselves beside the catalog's own", () => {
		const entries = mergeInstalled(
			sidecar,
			[
				{
					name: tracked.fileName,
					sizeBytes: 2048,
				},
				{
					name: "my-pack.zip",
					sizeBytes: 512,
				},
			],
			"0.6.3",
		);

		expect(entries.map((entry) => entry.id)).toEqual([
			"918273",
			"my-pack.zip",
		]);

		expect(entries.at(1)).toMatchObject({
			provider: null,
			title: "my-pack.zip",
			version: null,
			stale: false,
			enabled: true,
		});
	});

	test("ignores anything in the folder that is not a mod, the sidecar included", () => {
		expect(
			mergeInstalled(
				{},
				[
					{
						name: ".serverk-mods.json",
						sizeBytes: 12,
					},
					{
						name: "notes.txt",
						sizeBytes: 12,
					},
				],
				"0.6.3",
			),
		).toEqual([]);
	});

	test("reads a parked file as installed but off", () => {
		expect(
			mergeInstalled(
				sidecar,
				[
					{
						name: `${tracked.fileName}.disabled`,
						sizeBytes: 2048,
					},
				],
				"0.6.3",
			).at(0),
		).toMatchObject({
			id: "918273",
			enabled: false,
			path: `${MODS_DIRECTORY}/HeroCore-1.4.2.jar.disabled`,
		});
	});
});

describe("reading the versions a file declares", () => {
	test("a file tagged with the line it was built for covers every patch on that line", () => {
		expect(
			coversVersion(
				[
					"0.6",
				],
				"0.6.3",
			),
		).toBe(true);
	});

	test("a file tagged with the exact version covers it", () => {
		expect(
			coversVersion(
				[
					"0.6.3",
				],
				"0.6.3",
			),
		).toBe(true);
	});

	test("a file tagged with another line covers nothing on ours", () => {
		expect(
			coversVersion(
				[
					"0.5",
					"0.7.0",
				],
				"0.6.3",
			),
		).toBe(false);
	});
});

describe("warning that a game update left a mod behind", () => {
	test("a mod we just installed is never stale, however short the version its file declares", () => {
		expect(
			isStale(
				{
					...tracked,
					gameVersion: "0.6",
					gameVersions: [
						"0.6",
					],
				},
				"0.6.3",
			),
		).toBe(false);
	});

	test("a mod carried across a patch its file still covers is not stale", () => {
		expect(
			isStale(
				{
					...tracked,
					installedFor: "0.6.2",
					gameVersions: [
						"0.6",
					],
				},
				"0.6.3",
			),
		).toBe(false);
	});

	test("a mod left behind by an update its file does not cover is stale", () => {
		const behind: ModEntry = {
			...tracked,
			installedFor: "0.5.9",
			gameVersions: [
				"0.5",
			],
		};

		expect(isStale(behind, "0.6.3")).toBe(true);

		expect(
			mergeInstalled(
				{
					[behind.fileName]: behind,
				},
				[
					{
						name: behind.fileName,
						sizeBytes: 2048,
					},
				],
				"0.6.3",
			).at(0)?.stale,
		).toBe(true);
	});

	test("nothing is stale when we cannot tell which version the server runs", () => {
		expect(isStale(tracked, null)).toBe(false);
	});

	test("an entry written before we recorded the install version waits for its next install", () => {
		expect(isStale(legacy, "0.7.0")).toBe(false);
	});

	test("a file the customer uploaded is never stale, because it never told us a version", () => {
		expect(
			catalogEntry(
				{
					name: "my-pack.zip",
					sizeBytes: 512,
				},
				undefined,
				"0.7.0",
			),
		).toMatchObject({
			provider: null,
			gameVersion: null,
			stale: false,
		});
	});
});

describe("finding the files an id stands for", () => {
	test("finds the file the catalog installed for a project", () => {
		expect(trackedNames(sidecar, "918273")).toEqual([
			tracked.fileName,
		]);
	});

	test("finds a file by its own name, parked or not", () => {
		expect(trackedNames(sidecar, `${tracked.fileName}.disabled`)).toEqual([
			tracked.fileName,
		]);
	});

	test("finds nothing for a project this server never installed", () => {
		expect(trackedNames(sidecar, "404404")).toEqual([]);
	});
});

describe("installing a project the server already tracks", () => {
	test("does not download again when curseforge still points at the file we hold", () => {
		expect(needsDownload(tracked, tracked.fileId)).toBe(false);
	});

	test("downloads when curseforge has published a newer file", () => {
		expect(needsDownload(tracked, "9998887")).toBe(true);
	});

	test("downloads for a project this server never installed", () => {
		expect(needsDownload(null, "5544332")).toBe(true);
	});

	test("records the version the server runs now so the mod stops reading as stale", () => {
		const behind: ModEntry = {
			...tracked,
			installedFor: "0.5.9",
			gameVersions: [
				"0.5",
			],
		};

		const refreshed = refreshedEntry(
			behind,
			file({
				id: 5_544_332,
				gameVersions: [
					"0.6",
				],
			}),
			"0.6.3",
		);

		expect(refreshed).toMatchObject({
			fileId: "5544332",
			gameVersion: "0.6",
			gameVersions: [
				"0.6",
			],
			installedFor: "0.6.3",
		});

		expect(isStale(refreshed, "0.6.3")).toBe(false);
	});
});

describe("naming a catalog category", () => {
	test("gives a known category its arabic label", () => {
		expect(
			categoryLabel({
				id: 9285,
				name: "Blocks",
			}),
		).toEqual({
			ar: "بلوكات",
			en: "Blocks",
		});
	});

	test("replaces the curseforge hierarchy separator in a known label", () => {
		expect(
			categoryLabel({
				id: 9283,
				name: "Mobs\\Characters",
			}),
		).toEqual({
			ar: "مخلوقات وشخصيات",
			en: "Mobs & Characters",
		});
	});

	test("falls back to the cleaned english name in both locales", () => {
		expect(
			categoryLabel({
				id: 99_999,
				name: "Redstone\\Automation",
			}),
		).toEqual({
			ar: "Redstone & Automation",
			en: "Redstone & Automation",
		});
	});

	test("never leaks a backslash into either locale", () => {
		const labels = [
			...Object.values(CATEGORY_LABELS),
			categoryLabel({
				id: 99_998,
				name: "Tools\\Weapons\\Armor",
			}),
		];

		for (const label of labels) {
			expect(label.ar).not.toInclude("\\");
			expect(label.en).not.toInclude("\\");
		}
	});

	test("every known label carries arabic that differs from the english one", () => {
		for (const label of Object.values(CATEGORY_LABELS)) {
			expect(label.ar.length).toBeGreaterThan(0);
			expect(label.ar).not.toBe(label.en);
		}
	});

	test("names a hit category with the cleaned english label", () => {
		expect(
			categoryName({
				id: 10_466,
				name: "Cosmetics\\Armor",
			}),
		).toBe("Cosmetics & Armor");
	});

	test("names an unknown hit category with its cleaned english name", () => {
		expect(
			categoryName({
				id: 99_997,
				name: "Magic\\Rituals",
			}),
		).toBe("Magic & Rituals");
	});
});

const PROJECT_ID = 918_273;

const project = {
	id: PROJECT_ID,
	classId: null,
	name: "HeroCore API",
	slug: "herocore-api",
	summary: "",
	downloadCount: 0,
	authors: [],
	categories: [],
	dateModified: "2026-09-01T00:00:00Z",
	links: {
		websiteUrl: "https://www.curseforge.com/hytale/mods/herocore-api",
	},
	logo: null,
};

const projectFiles = [
	file({
		id: 5_544_330,
		fileName: "HeroCore-1.4.0.jar",
		displayName: "HeroCore 1.4.0",
	}),
	file({
		id: 5_544_332,
		fileName: "HeroCore-1.4.2.jar",
		displayName: "HeroCore 1.4.2",
	}),
	file({
		id: 5_544_335,
		fileName: "HeroCore-1.5.0-beta.jar",
		displayName: "HeroCore 1.5.0 beta",
		releaseType: CurseforgeReleaseType.Beta,
	}),
];

const foreignFile = file({
	id: 7_000_001,
	modId: 111_111,
	fileName: "Other.jar",
	displayName: "Other 1.0.0",
});

interface CatalogServer {
	context: Bridge.Context;
	stored: Map<string, string>;
	downloads: string[];
}

const catalogServer = (): CatalogServer => {
	const stored = new Map<string, string>([
		...PAYLOAD_FILES.map(
			(
				path,
			): [
				string,
				string,
			] => [
				path,
				"",
			],
		),
		[
			INSTALL_STAMP_FILE,
			JSON.stringify({
				installer: "0.6.3",
				version: "0.6.3",
			}),
		],
	]);
	const downloads: string[] = [];
	const everyFile = [
		...projectFiles,
		foreignFile,
	];

	const answer = (url: string): unknown => {
		const path = new URL(url).pathname.replace(new URL(CURSEFORGE_API).pathname, "");
		const single = path.match(/^\/mods\/(?<mod>\d+)\/files\/(?<file>\d+)$/);

		if (single?.groups) {
			const found = everyFile.find(
				(entry) => String(entry.modId) === single.groups?.mod && String(entry.id) === single.groups?.file,
			);

			if (!found) {
				throw new BridgeNetError(404, "not found");
			}

			return {
				data: found,
			};
		}

		if (path === `/mods/${PROJECT_ID}/files`) {
			return {
				data: projectFiles,
				pagination: {
					index: 0,
					pageSize: projectFiles.length,
					resultCount: projectFiles.length,
					totalCount: projectFiles.length,
				},
			};
		}

		if (path === `/mods/${PROJECT_ID}`) {
			return {
				data: project,
			};
		}

		throw new BridgeNetError(404, `no route for ${path}`);
	};

	const log = Object.assign(() => undefined, {
		warn: () => undefined,
		error: () => undefined,
	});

	const context = {
		secret: () => "curseforge-key",
		net: {
			json: async (url: string) => answer(url),
		},
		log,
		files: {
			exists: async (path: string) => stored.has(path),
			read: async (path: string) => stored.get(path) ?? "",
			write: async (path: string, content: string) => {
				stored.set(path, content);
			},
			ensure: async () => undefined,
			remove: async (path: string) => {
				stored.delete(path);
			},
			move: async (from: string, to: string) => {
				stored.set(to, stored.get(from) ?? "");
				stored.delete(from);
			},
			download: async (path: string) => {
				downloads.push(path);
				stored.set(path, "");
			},
		},
	} as unknown as Bridge.Context;

	return {
		context,
		stored,
		downloads,
	};
};

describe("listing the releases a mod offers", () => {
	test("offers only release builds, newest first, on the release patchline", () => {
		expect(releasesOf(projectFiles, "release", "0.6.3")).toEqual([
			{
				id: "5544332",
				label: "HeroCore 1.4.2",
				gameVersion: "0.6.3",
			},
			{
				id: "5544330",
				label: "HeroCore 1.4.0",
				gameVersion: "0.6.3",
			},
		]);
	});

	test("offers every channel on any other patchline", () => {
		expect(releasesOf(projectFiles, "pre-release", "0.6.3").map((release) => release.id)).toEqual([
			"5544335",
			"5544332",
			"5544330",
		]);
	});

	test("leaves the game version out when a file declares none", () => {
		expect(
			releasesOf(
				[
					file({
						id: 3,
						gameVersions: [],
					}),
				],
				"release",
				null,
			),
		).toEqual([
			{
				id: "3",
				label: "mod 1.0.0",
			},
		]);
	});

	test("skips a file curseforge marks unavailable", () => {
		expect(
			releasesOf(
				[
					file({
						id: 4,
						isAvailable: false,
					}),
				],
				"release",
				"0.6.3",
			),
		).toEqual([]);
	});

	test("asks curseforge for the project's files and maps them for the panel", async () => {
		const { context } = catalogServer();

		expect((await mods.releases?.(context, String(PROJECT_ID)))?.map((release) => release.id)).toEqual([
			"5544332",
			"5544330",
		]);
	});
});

describe("installing a chosen release", () => {
	test("installs the release the customer picked instead of the newest one", async () => {
		const { context, downloads, stored } = catalogServer();

		const entry = await mods.install(context, String(PROJECT_ID), "5544330");

		expect(downloads).toEqual([
			`${MODS_DIRECTORY}/HeroCore-1.4.0.jar`,
		]);
		expect(entry.version).toBe("HeroCore 1.4.0");
		expect(JSON.parse(stored.get(`${MODS_DIRECTORY}/.serverk-mods.json`) ?? "{}")["HeroCore-1.4.0.jar"].fileId).toBe(
			"5544330",
		);
	});

	test("installs the newest matching release when none is picked", async () => {
		const { context, downloads } = catalogServer();

		await mods.install(context, String(PROJECT_ID));

		expect(downloads).toEqual([
			`${MODS_DIRECTORY}/HeroCore-1.4.2.jar`,
		]);
	});

	test("refuses a release that belongs to another project", async () => {
		const { context, downloads } = catalogServer();

		await expect(mods.install(context, String(PROJECT_ID), String(foreignFile.id))).rejects.toBeInstanceOf(
			BridgeUserError,
		);
		expect(downloads).toEqual([]);
	});

	test("refuses a beta release on the release patchline", async () => {
		const { context, downloads } = catalogServer();

		await expect(mods.install(context, String(PROJECT_ID), "5544335")).rejects.toBeInstanceOf(BridgeUserError);
		expect(downloads).toEqual([]);
	});

	test("refuses a release id that is not a curseforge file id", async () => {
		const { context, downloads } = catalogServer();

		await expect(mods.install(context, String(PROJECT_ID), "../../etc")).rejects.toBeInstanceOf(BridgeUserError);
		expect(downloads).toEqual([]);
	});
});

describe("previewing an install", () => {
	test("names the release it will install and warns that a recovery backup comes first", async () => {
		const { context, downloads } = catalogServer();

		const preview = await mods.preview?.(context, String(PROJECT_ID), "5544330");

		expect(preview?.confirm).toBe(BridgeConfirm.Normal);
		expect(preview?.lines).toHaveLength(2);
		expect(preview?.lines.at(1)).toEqual({
			ar: "HeroCore API: HeroCore 1.4.0",
			en: "HeroCore API: HeroCore 1.4.0",
		});
		expect(preview?.lines.at(0)?.ar.length).toBeGreaterThan(0);
		expect(downloads).toEqual([]);
	});

	test("names the newest matching release when none is picked", async () => {
		const { context } = catalogServer();

		expect((await mods.preview?.(context, String(PROJECT_ID)))?.lines.at(1)?.en).toBe("HeroCore API: HeroCore 1.4.2");
	});

	test("refuses to preview a release the install would refuse", async () => {
		const { context } = catalogServer();

		await expect(mods.preview?.(context, String(PROJECT_ID), String(foreignFile.id))).rejects.toBeInstanceOf(
			BridgeUserError,
		);
	});
});

describe("protecting mod changes with a recovery backup", () => {
	test("protects install, remove and toggle, the three actions that change the mods folder", () => {
		expect(mods.protectedActions).toEqual([
			BridgeAction.Install,
			BridgeAction.Remove,
			BridgeAction.Toggle,
		]);
	});

	test("protects only mutations the module actually implements", () => {
		for (const action of mods.protectedActions ?? []) {
			expect(isReadAction(action)).toBe(false);
			expect(typeof mods[action as keyof Bridge.Catalog]).toBe("function");
		}
	});

	test("leaves the read actions unprotected", () => {
		for (const action of [
			BridgeAction.Search,
			BridgeAction.Installed,
			BridgeAction.Releases,
			BridgeAction.Preview,
		]) {
			expect(isReadAction(action)).toBe(true);
			expect(mods.protectedActions).not.toContain(action);
		}
	});
});
