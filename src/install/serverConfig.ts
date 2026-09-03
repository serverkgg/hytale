import type { Bridge } from "@serverkgg/bridge";
import {
	BACKUP_SECTION,
	CONFIG_FILE,
	JVM_OPTIONS_FILE,
	jvmOptions,
	mergeConfig,
	mergeSection,
	PATCHLINE,
	PERMISSIONS_FILE,
	readConfig,
	SERVER_DIRECTORY,
	SERVER_PERMISSIONS_FILE,
	UPDATE_SECTION,
} from "../shared";

const CHECK_INTERVAL_SECONDS = 3600;

const AUTO_APPLY_DELAY_MINUTES = 30;

const AUTO_APPLY_WHEN_EMPTY = "WhenEmpty";

const LOCAL_BACKUP_COUNT = 3;

const RECOMMENDED_VIEW_RADIUS = 12;

const MODEST_VIEW_RADIUS = 8;

const COMFORTABLE_MEMORY_MB = 8192;

const PLAYERS_PER_MEMORY_GB = 4;

const MAX_RECOMMENDED_PLAYERS = 64;

const MEGABYTES_PER_GIGABYTE = 1024;

export const updateValues = (): Bridge.Values => {
	return {
		Enabled: true,
		CheckIntervalSeconds: CHECK_INTERVAL_SECONDS,
		NotifyPlayersOnAvailable: true,
		Patchline: PATCHLINE,
		RunBackupBeforeUpdate: true,
		BackupConfigBeforeUpdate: true,
		AutoApplyMode: AUTO_APPLY_WHEN_EMPTY,
		AutoApplyDelayMinutes: AUTO_APPLY_DELAY_MINUTES,
	};
};

export const backupValues = (): Bridge.Values => {
	return {
		MaxCount: LOCAL_BACKUP_COUNT,
		ArchiveMaxCount: LOCAL_BACKUP_COUNT,
	};
};

export interface HytaleSeedInput {
	code: string;
	memoryMb: number;
}

export const seedValues = (server: HytaleSeedInput): Bridge.Values => {
	return {
		ServerName: `Serverk ${server.code}`,
		MOTD: "Powered by serverk.gg",
		MaxPlayers: Math.min(
			Math.max(Math.floor((server.memoryMb / MEGABYTES_PER_GIGABYTE) * PLAYERS_PER_MEMORY_GB), 1),
			MAX_RECOMMENDED_PLAYERS,
		),
		MaxViewRadius: server.memoryMb >= COMFORTABLE_MEMORY_MB ? RECOMMENDED_VIEW_RADIUS : MODEST_VIEW_RADIUS,
	};
};

export const missingValues = (current: Bridge.Values, seeds: Bridge.Values): Bridge.Values => {
	return Object.fromEntries(
		Object.entries(seeds).filter(([key]) => {
			return String(current[key] ?? "").length === 0;
		}),
	);
};

export const seedPermissions = async (context: Bridge.Context, path: string) => {
	if (await context.files.exists(path)) {
		return false;
	}

	await context.files.write(path, "{}\n");

	return true;
};

export const writeJvmOptions = async (context: Bridge.Context) => {
	await context.files.write(JVM_OPTIONS_FILE, `${jvmOptions(context.server.memoryMb).join("\n")}\n`);
};

const adoptMigrated = async (context: Bridge.Context, file: string) => {
	if (!(await context.files.exists(file))) {
		return;
	}

	const target = `${SERVER_DIRECTORY}/${file}`;

	if (await context.files.exists(target)) {
		await context.files.remove(file);

		return;
	}

	await context.files.move(file, target);
};

export const applyServerConfig = async (context: Bridge.Context) => {
	await adoptMigrated(context, CONFIG_FILE);
	await adoptMigrated(context, PERMISSIONS_FILE);
	await seedPermissions(context, SERVER_PERMISSIONS_FILE);

	const seeds = missingValues(await readConfig(context), seedValues(context.server));

	if (Object.keys(seeds).length > 0) {
		await mergeConfig(context, seeds);
	}

	await mergeSection(context, UPDATE_SECTION, updateValues());
	await mergeSection(context, BACKUP_SECTION, backupValues());
	await writeJvmOptions(context);
};

export const applyBootstrapConfig = async (context: Bridge.Context) => {
	await seedPermissions(context, PERMISSIONS_FILE);

	const seeds = missingValues(await readConfig(context), seedValues(context.server));

	if (Object.keys(seeds).length > 0) {
		await mergeConfig(context, seeds);
	}

	await mergeSection(context, UPDATE_SECTION, updateValues());
	await writeJvmOptions(context);
};
