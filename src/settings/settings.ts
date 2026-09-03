import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { mergeConfig, readConfig } from "../shared";

export const settings: Bridge.Settings = {
	kind: BridgeKind.Settings,
	async read(context) {
		return await readConfig(context);
	},
	async write(context, values) {
		await mergeConfig(context, values);
	},
};
