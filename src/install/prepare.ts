import type { Bridge } from "@serverkgg/bridge";
import { HytaleStage, stageOf } from "../shared";
import { ensureInstaller } from "./bootstrapInstaller";
import { applyBootstrapConfig, applyServerConfig } from "./serverConfig";

export const prepareStage = async (context: Bridge.Context): Promise<HytaleStage> => {
	const stage = await stageOf(context);

	if (stage === HytaleStage.Server) {
		await applyServerConfig(context);

		return stage;
	}

	await ensureInstaller(context);
	await applyBootstrapConfig(context);

	return stage;
};
