import { type Bridge, BridgeUserError } from "@serverkgg/bridge";
import { writeStamp } from "@serverkgg/bridge/install";
import {
	BOOTSTRAP_JAR,
	digestUrl,
	jarUrl,
	MAVEN_METADATA_URL,
	METADATA_CACHE_SECONDS,
	parseMavenDigest,
	parseMavenMetadata,
} from "../shared";
import type { InstallStamp } from "./installStamp";

const DOWNLOAD_TIMEOUT_MS = 900_000;

const METADATA_TIMEOUT_MS = 30_000;

export const UNREACHABLE: Bridge.Text = {
	ar: "ما قدرنا نوصل لسيرفرات هايتيل عشان ننزّل مثبّت السيرفر. جرّب تشغّل سيرفرك مرة ثانية بعد شوي.",
	en: "We could not reach Hytale to download the server installer. Start your server again in a moment.",
};

export const latestRelease = async (context: Bridge.Context) => {
	const metadata = parseMavenMetadata(
		await context.net.text(MAVEN_METADATA_URL, {
			cache: true,
			cacheSeconds: METADATA_CACHE_SECONDS,
			timeoutMs: METADATA_TIMEOUT_MS,
		}),
	);

	if (metadata.release === null) {
		context.log.warn("hytale maven listed no server release");

		throw new BridgeUserError(UNREACHABLE);
	}

	return metadata.release;
};

const releaseDigest = async (context: Bridge.Context, version: string) => {
	try {
		return parseMavenDigest(
			await context.net.text(digestUrl(version), {
				cache: true,
				cacheSeconds: METADATA_CACHE_SECONDS,
				timeoutMs: METADATA_TIMEOUT_MS,
			}),
		);
	} catch (error) {
		context.log.warn("hytale published no checksum beside the server jar, downloading it unverified", {
			version,
			reason: error instanceof Error ? error.message : String(error),
		});

		return null;
	}
};

export const ensureInstaller = async (context: Bridge.Context) => {
	if (await context.files.exists(BOOTSTRAP_JAR)) {
		return false;
	}

	const version = await latestRelease(context);
	const digest = await releaseDigest(context, version);

	context.log("downloading the hytale server installer", {
		version,
		digest,
	});

	await context.files.download(BOOTSTRAP_JAR, jarUrl(version), {
		...(digest === null
			? {}
			: {
					digest,
				}),
		cache: true,
		timeoutMs: DOWNLOAD_TIMEOUT_MS,
	});

	await writeStamp<InstallStamp>(context, {
		installer: version,
		version: null,
	});

	return true;
};
