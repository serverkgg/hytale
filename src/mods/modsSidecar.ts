import type { Bridge } from "@serverkgg/bridge";

export const MODS_SIDECAR = ".serverk-mods.json";

export interface ModEntry {
	id: string;
	provider: string;
	projectId: string;
	fileId: string;
	title: string;
	version: string;
	gameVersion: string | null;
	gameVersions?: string[];
	installedFor?: string | null;
	fileName: string;
	pageUrl: string | null;
	icon: string | null;
	sizeBytes: number;
}

export type ModsSidecar = Record<string, ModEntry>;

export const sidecarPath = (directory: string) => {
	return `${directory}/${MODS_SIDECAR}`;
};

export const parseSidecar = (text: string): ModsSidecar => {
	try {
		const parsed = JSON.parse(text) as unknown;

		return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as ModsSidecar) : {};
	} catch {
		return {};
	}
};

export const serializeSidecar = (sidecar: ModsSidecar) => {
	return `${JSON.stringify(sidecar, null, 2)}\n`;
};

export const readSidecar = async (context: Bridge.Context, directory: string): Promise<ModsSidecar> => {
	const path = sidecarPath(directory);

	if (!(await context.files.exists(path))) {
		return {};
	}

	try {
		return parseSidecar(await context.files.read(path));
	} catch {
		return {};
	}
};

export const writeSidecar = async (context: Bridge.Context, directory: string, sidecar: ModsSidecar) => {
	await context.files.write(sidecarPath(directory), serializeSidecar(sidecar));
};
