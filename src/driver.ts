import type { BridgeDriver } from "@serverkgg/bridge";
import { live } from "./actions";
import { announce } from "./announce";
import { players } from "./collections";
import { login } from "./details";
import { events } from "./events";
import { install } from "./install";
import { lifecycle } from "./lifecycle";
import { mods } from "./mods";
import { panel } from "./panel";
import { query } from "./query";
import { settings } from "./settings";
import { setup } from "./setup";
import { terminal } from "./terminal";

export const driver: BridgeDriver = {
	install,
	lifecycle,
	events,
	query,
	announce,
	setup,
	terminal,
	panel,
	modules: {
		settings,
		players,
		login,
		live,
		mods,
	},
};
