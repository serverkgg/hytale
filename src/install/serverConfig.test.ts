import { describe, expect, test } from "bun:test";
import { backupValues, missingValues, seedValues, updateValues } from "./serverConfig";

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
