import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { isServerInstalled, PATCHLINE } from "../shared";
import { seedCredentials } from "./credentials";
import { availableVersion, checkDownloaderVersion, downloadGame, extractGame } from "./download";
import { readStamp, writeStamp } from "./installStamp";
import { seedConfig } from "./seedConfig";

const resolveVersion = async (context: Bridge.Context, installed: boolean) => {
	try {
		return await availableVersion(context);
	} catch (error) {
		if (!installed) {
			throw error;
		}

		context.log.warn("could not reach hytale to check for a newer version, keeping what is installed", {
			reason: error instanceof Error ? error.message : String(error),
		});

		return null;
	}
};

export const install: Bridge.Install = {
	kind: BridgeKind.Install,
	async run(context) {
		await seedCredentials(context, false);
		await checkDownloaderVersion(context);

		const installed = await isServerInstalled(context);
		const stamp = await readStamp(context);
		const available = await resolveVersion(context, installed);

		if (available === null) {
			return;
		}

		if (installed && stamp?.version === available) {
			context.log("hytale is up to date", {
				version: available,
				patchline: PATCHLINE,
			});

			await seedConfig(context);

			return;
		}

		context.log(installed ? "a newer hytale version is available" : "downloading the hytale dedicated server", {
			from: stamp?.version ?? null,
			to: available,
			patchline: PATCHLINE,
		});

		await downloadGame(context);
		await extractGame(context);
		await seedConfig(context);
		await writeStamp(context, {
			version: available,
		});

		context.log("install complete", {
			version: available,
		});
	},
	async describe(context) {
		const stamp = await readStamp(context);

		return {
			version: stamp?.version ?? null,
			variant: null,
			build: null,
		};
	},
};
