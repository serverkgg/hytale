import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { startingRuntime } from "../setup";
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

		context.setup.report(startingRuntime());

		context.log("hytale is ready to be set up, the setup page walks the customer through the sign-in");
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
