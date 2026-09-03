import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { HytaleStage } from "../shared";
import { readStamp } from "./installStamp";
import { prepareStage } from "./prepare";

export const install: Bridge.Install = {
	kind: BridgeKind.Install,
	async run(context) {
		const stage = await prepareStage(context);

		if (stage === HytaleStage.Server) {
			context.log("hytale is installed and keeps itself up to date from inside the server");

			return;
		}

		context.log("hytale is ready to be set up, start the server and sign it in from the login tab");
	},
	async describe(context) {
		const stamp = await readStamp(context);

		return {
			version: stamp?.version ?? stamp?.installer ?? null,
			variant: null,
			build: null,
		};
	},
};
