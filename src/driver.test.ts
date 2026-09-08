import { describe, expect, test } from "bun:test";
import { BridgeControl, BridgeLayout, BridgeSetupStepKind } from "@serverkgg/bridge";
import { GuideOpenTab } from "@serverkgg/bridge/guides";
import { isBridgeEventName } from "@serverkgg/bridge/protocol";
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

const steps = driver.setup?.steps ?? [];

const formSection = (tabId: string, sectionId: string) => {
	const tab = (driver.panel?.tabs ?? []).find((entry) => entry.id === tabId);
	const section = tab?.sections.find((entry) => entry.id === sectionId);

	return section?.layout === BridgeLayout.Form ? section : null;
};

describe("walking the customer through the first run", () => {
	test("asks for the sign-in and the download before anything optional", () => {
		expect(steps.map((step) => step.id)).toEqual([
			"sign-in",
			"download",
			"name",
			"invite",
		]);
	});

	test("drives the sign-in and the download from the driver itself", () => {
		expect(steps.filter((step) => step.kind === BridgeSetupStepKind.Driver).map((step) => step.id)).toEqual([
			"sign-in",
			"download",
		]);
	});

	test("needs a running server for the sign-in, because the code comes out of the console", () => {
		const signIn = steps.find((step) => step.id === "sign-in");

		expect(signIn?.kind === BridgeSetupStepKind.Driver && signIn.requiresRunning).toBe(true);
	});

	test("lets the customer skip only the two steps a server runs fine without", () => {
		expect(steps.filter((step) => step.required === false).map((step) => step.id)).toEqual([
			"name",
			"invite",
		]);
	});

	test("points the form step at a form section the panel really declares", () => {
		for (const step of steps) {
			if (step.kind !== BridgeSetupStepKind.Form) {
				continue;
			}

			expect(formSection(step.tab, step.section)).not.toBeNull();
		}
	});

	test("names only fields that section really carries", () => {
		for (const step of steps) {
			if (step.kind !== BridgeSetupStepKind.Form) {
				continue;
			}

			const keys = (formSection(step.tab, step.section)?.fields ?? []).map((field) => field.key);

			for (const key of step.fields ?? []) {
				expect(keys).toContain(key);
			}
		}
	});

	test("sends the invite step to the access page, where the address lives", () => {
		const invite = steps.find((step) => step.id === "invite");

		expect(invite?.kind === BridgeSetupStepKind.Open && invite.target.tab).toBe(GuideOpenTab.Access);
	});

	test("titles and explains every step in both arabic and english", () => {
		for (const step of steps) {
			expect(step.title.ar.length).toBeGreaterThan(0);
			expect(step.title.en.length).toBeGreaterThan(0);
			expect(step.help?.ar.length).toBeGreaterThan(0);
			expect(step.help?.en.length).toBeGreaterThan(0);
		}
	});

	test("leaves the sign-in to the setup page, so the account detail no longer starts one", () => {
		const account = sections.find((section) => section.id === "hytale-account");
		const actions = (account?.layout === BridgeLayout.Detail ? (account.actions ?? []) : []).map((action) => action.id);

		expect(actions).not.toContain("begin");
		expect(actions).toContain("switch");
	});
});

const formFields = (tabId: string, sectionId: string) => {
	const tab = (driver.panel?.tabs ?? []).find((entry) => entry.id === tabId);
	const section = tab?.sections.find((entry) => entry.id === sectionId);

	return section?.layout === BridgeLayout.Form ? section.fields : [];
};

describe("keeping the customer's own secrets out of everyone else's hands", () => {
	test("keeps the join password a secret", () => {
		const password = formFields("settings", "server").find((field) => field.key === "Password");

		expect(password?.control).toBe(BridgeControl.Secret);
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
		expect(driver.setup).toBeDefined();
		expect(driver.terminal).toBeDefined();
		expect(driver.panel).toBeDefined();
	});

	test("registers the settings, players, login, live and mods modules the tabs reference", () => {
		expect(Object.keys(modules)).toEqual([
			"settings",
			"players",
			"login",
			"live",
			"mods",
		]);
	});

	test("keeps the setup singleton out of the panel modules, because its id is reserved", () => {
		expect(Object.keys(modules)).not.toContain("setup");
	});

	test("emits only names the platform's event taxonomy knows", () => {
		const declared = [
			...(driver.events?.patterns ?? []).map((pattern) => pattern.emit),
			...(driver.events?.emits ?? []),
		];

		for (const name of declared) {
			expect(isBridgeEventName(name)).toBe(true);
		}
	});
});
