import { describe, expect, test } from "bun:test";
import { BridgeLayout } from "@serverkgg/bridge";
import { driver } from "./driver";
import { parseWho } from "./shared";

const modules = driver.modules ?? {};

const sections = (driver.panel?.tabs ?? []).flatMap((tab) => tab.sections);

const tables = sections.flatMap((section) => {
	return section.layout === BridgeLayout.Table
		? [
				section,
			]
		: [];
});

const args = (driver.terminal?.commands ?? []).flatMap((command) => command.args ?? []);

const columnsOf = (module: string) => {
	return tables
		.filter((table) => table.module === module)
		.flatMap((table) => table.columns.map((column) => column.key));
};

const ROSTER_KEYS = Object.keys(
	parseWho([
		"Mohammed (meslzy)",
	]).at(0) ?? {},
);

describe("wiring the terminal autocomplete to the live roster", () => {
	test("completes every argument from a module the driver actually registers", () => {
		for (const arg of args) {
			expect(Object.keys(modules)).toContain(arg.module ?? "");
		}
	});

	test("completes every argument from a column that module's table shows", () => {
		for (const arg of args) {
			expect(columnsOf(arg.module ?? "")).toContain(arg.column ?? "");
		}
	});

	test("completes every argument from a field the roster really carries", () => {
		for (const arg of args) {
			expect(ROSTER_KEYS).toContain(arg.column ?? "");
		}
	});
});

describe("wiring the players table to the roster the collection returns", () => {
	test("shows only columns the roster carries", () => {
		for (const key of columnsOf("players")) {
			expect(ROSTER_KEYS).toContain(key);
		}
	});

	test("shows the display name and the account name /who prints", () => {
		expect(columnsOf("players")).toEqual([
			"name",
			"username",
		]);
	});
});

describe("assembling the hytale driver", () => {
	test("registers every module the panel binds a section to", () => {
		for (const section of sections) {
			if (section.layout !== BridgeLayout.Form) {
				expect(Object.keys(modules)).toContain(section.module);
			}
		}
	});

	test("declares every capability the panel and the platform depend on", () => {
		expect(driver.install).toBeDefined();
		expect(driver.lifecycle).toBeDefined();
		expect(driver.events).toBeDefined();
		expect(driver.query).toBeDefined();
		expect(driver.announce).toBeDefined();
		expect(driver.terminal).toBeDefined();
		expect(driver.panel).toBeDefined();
	});

	test("registers the settings, players, login and live modules the tabs reference", () => {
		expect(Object.keys(modules)).toEqual([
			"settings",
			"players",
			"login",
			"live",
		]);
	});

	test("emits only names the platform's event taxonomy knows", () => {
		const declared = [
			...(driver.events?.patterns ?? []).map((pattern) => pattern.emit),
			...(driver.events?.emits ?? []),
		];

		for (const name of declared) {
			expect([
				"GameModeChanged",
				"MemoryUndersized",
				"MissingDependency",
				"ModCrashed",
				"PlayerAdvanced",
				"PlayerDied",
				"PlayerJoined",
				"PlayerLeft",
				"PortBindFailed",
				"ServerCrashed",
				"ServerStarted",
				"ServerStopping",
				"TickLagging",
				"WorldCorrupt",
				"WorldSaved",
				"WrongJavaVersion",
			]).toContain(name);
		}
	});
});
