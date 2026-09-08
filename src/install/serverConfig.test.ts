import { describe, expect, test } from "bun:test";
import type { Bridge } from "@serverkgg/bridge";
import { backupValues, missingValues, reclaimRestoredFiles, seedValues, updateValues } from "./serverConfig";

describe("updateValues", () => {
	test("applies an update on a schedule, because one player who never leaves must not lock everyone else out", () => {
		expect(updateValues().AutoApplyMode).toBe("Scheduled");
		expect(updateValues().AutoApplyDelayMinutes).toBe(15);
		expect(updateValues().Enabled).toBe(true);
	});

	test("takes a snapshot of the world and the config before it applies one", () => {
		expect(updateValues().RunBackupBeforeUpdate).toBe(true);
		expect(updateValues().BackupConfigBeforeUpdate).toBe(true);
	});

	test("checks the release patchline once an hour", () => {
		expect(updateValues().Patchline).toBe("release");
		expect(updateValues().CheckIntervalSeconds).toBe(3600);
	});
});

describe("backupValues", () => {
	test("keeps the server's own snapshots small, because the platform's backups are the ones a player restores from", () => {
		expect(backupValues().MaxCount).toBe(2);
		expect(backupValues().ArchiveMaxCount).toBe(1);
	});
});

describe("seedValues", () => {
	test("names the server after its code", () => {
		expect(
			seedValues({
				code: "srv-1234",
				memoryMb: 4096,
			}).ServerName,
		).toBe("Serverk srv-1234");
	});

	test("sizes the player slots and the view distance from the plan", () => {
		expect(
			seedValues({
				code: "srv-1234",
				memoryMb: 4096,
			}),
		).toMatchObject({
			MaxPlayers: 16,
			MaxViewRadius: 8,
		});

		expect(
			seedValues({
				code: "srv-1234",
				memoryMb: 8192,
			}),
		).toMatchObject({
			MaxPlayers: 32,
			MaxViewRadius: 12,
		});
	});

	test("never recommends more players than hytale can hold", () => {
		expect(
			seedValues({
				code: "srv-1234",
				memoryMb: 65_536,
			}).MaxPlayers,
		).toBe(64);
	});
});

describe("missingValues", () => {
	test("seeds only what the config does not already answer", () => {
		expect(
			missingValues(
				{
					ServerName: "My world",
					MaxPlayers: "",
				},
				{
					ServerName: "Serverk srv-1234",
					MaxPlayers: 16,
					MOTD: "Powered by serverk.gg",
				},
			),
		).toEqual({
			MaxPlayers: 16,
			MOTD: "Powered by serverk.gg",
		});
	});

	test("leaves a config the player already filled alone", () => {
		expect(
			missingValues(
				{
					ServerName: "My world",
				},
				{
					ServerName: "Serverk srv-1234",
				},
			),
		).toEqual({});
	});
});

const reclaimContext = (seed: Record<string, string> = {}) => {
	const stored = new Map(Object.entries(seed));

	return {
		stored,
		context: {
			log: Object.assign(() => {}, {
				warn: () => {},
			}),
			files: {
				async exists(path: string) {
					return stored.has(path);
				},
				async remove(path: string) {
					stored.delete(path);
				},
				async move(from: string, to: string) {
					if (!stored.has(from)) {
						throw new Error(`"${from}" does not exist`);
					}

					if (stored.has(to)) {
						throw new Error(`"${to}" already exists`);
					}

					stored.set(to, stored.get(from) ?? "");
					stored.delete(from);
				},
			},
		} as unknown as Bridge.Context,
	};
};

describe("reclaimRestoredFiles", () => {
	test("brings a restored sign-in and settings back beside the installer, so a restore does not cost the customer the sign-in", async () => {
		const { context, stored } = reclaimContext({
			"Server/auth.enc": "sealed",
			"Server/auth.key": "key",
			"Server/config.json": '{"ServerName":"My world"}',
			"Server/permissions.json": "{}",
			"Server/universe": "world",
		});

		expect(await reclaimRestoredFiles(context)).toEqual([
			"auth.enc",
			"auth.key",
			"config.json",
			"permissions.json",
		]);

		expect(stored.get("auth.enc")).toBe("sealed");
		expect(stored.get("config.json")).toBe('{"ServerName":"My world"}');
		expect(stored.has("Server/auth.enc")).toBe(false);
		expect(stored.get("Server/universe")).toBe("world");
	});

	test("lets the restored copy win over one the installer already seeded", async () => {
		const { context, stored } = reclaimContext({
			"Server/config.json": '{"ServerName":"My world"}',
			"config.json": '{"ServerName":"Hytale Server"}',
		});

		expect(await reclaimRestoredFiles(context)).toEqual([
			"config.json",
		]);

		expect(stored.get("config.json")).toBe('{"ServerName":"My world"}');
	});

	test("does nothing on a server that never installed the payload", async () => {
		const { context, stored } = reclaimContext({
			"config.json": '{"ServerName":"Hytale Server"}',
		});

		expect(await reclaimRestoredFiles(context)).toEqual([]);
		expect(stored.get("config.json")).toBe('{"ServerName":"Hytale Server"}');
	});
});
