import type { Bridge } from "@serverkgg/bridge";
import {
	ASSETS_ARCHIVE,
	CREDENTIAL_REJECTED,
	DOWNLOADER_BINARY,
	execDetail,
	GAME_ARCHIVE,
	NEEDS_AUTHENTICATION,
	PATCHLINE,
	parsePrintedVersion,
	SERVER_DIRECTORY,
	SERVER_JAR,
} from "../shared";
import { STALE_CREDENTIALS, seedCredentials } from "./credentials";

const VERSION_TIMEOUT_MS = 180_000;

const DOWNLOAD_TIMEOUT_MS = 3_600_000;

const EXTRACT_TIMEOUT_MS = 1_800_000;

const PROGRESS = /(?<percent>\d{1,3})(?:\.\d+)?\s*%/;

const PROGRESS_STEP = 10;

const downloaderArguments = (extra: string[]) => {
	return [
		DOWNLOADER_BINARY,
		"-patchline",
		PATCHLINE,
		"-skip-update-check",
		...extra,
	];
};

export const downloadNarrator = (log: Bridge.Context["log"]) => {
	let reported = -1;

	return (raw: string) => {
		const line = raw.trim();

		if (line.length === 0) {
			return;
		}

		const percent = Number(line.match(PROGRESS)?.groups?.percent ?? Number.NaN);

		if (!Number.isFinite(percent)) {
			log(line);

			return;
		}

		const step = Math.floor(percent / PROGRESS_STEP) * PROGRESS_STEP;

		if (step > reported) {
			reported = step;

			log("downloading the hytale game package", {
				percent: step,
			});
		}
	};
};

export const checkDownloaderVersion = async (context: Bridge.Context) => {
	const result = await context.exec(
		[
			DOWNLOADER_BINARY,
			"-check-update",
		],
		{
			timeoutMs: VERSION_TIMEOUT_MS,
		},
	);

	const detail = execDetail(result);

	if (detail.length > 0) {
		context.log(detail);
	}
};

export const credentialsRejected = (result: Bridge.ExecResult) => {
	const output = `${result.stdout}\n${result.stderr}`;

	return NEEDS_AUTHENTICATION.test(output) || CREDENTIAL_REJECTED.test(output);
};

const printVersion = async (context: Bridge.Context) => {
	return await context.exec(
		downloaderArguments([
			"-print-version",
		]),
		{
			timeoutMs: VERSION_TIMEOUT_MS,
		},
	);
};

export const availableVersion = async (context: Bridge.Context): Promise<string> => {
	let result = await printVersion(context);

	if (credentialsRejected(result)) {
		context.log("the hytale downloader refused the stored session, seeding it again from the platform secret");

		await seedCredentials(context, true);

		result = await printVersion(context);

		if (credentialsRejected(result)) {
			throw new Error(`${STALE_CREDENTIALS} — ${execDetail(result)}`);
		}
	}

	const version = parsePrintedVersion(result.stdout);

	if (version === null) {
		throw new Error(`the hytale downloader did not report a version — ${execDetail(result)}`);
	}

	return version;
};

export const downloadGame = async (context: Bridge.Context) => {
	await context.files.remove(GAME_ARCHIVE);

	const result = await context.exec(
		downloaderArguments([
			"-download-path",
			GAME_ARCHIVE,
		]),
		{
			timeoutMs: DOWNLOAD_TIMEOUT_MS,
			onOutput: downloadNarrator(context.log),
		},
	);

	if (result.code !== 0) {
		throw new Error(
			`${credentialsRejected(result) ? STALE_CREDENTIALS : "the hytale game package could not be downloaded"} — ${execDetail(result)}`,
		);
	}

	if (!(await context.files.exists(GAME_ARCHIVE))) {
		throw new Error("the hytale downloader finished but wrote no game package");
	}
};

export const extractGame = async (context: Bridge.Context) => {
	context.log("unpacking the hytale game package");

	const result = await context.exec(
		[
			"unzip",
			"-o",
			"-q",
			GAME_ARCHIVE,
			ASSETS_ARCHIVE,
			`${SERVER_DIRECTORY}/*`,
		],
		{
			timeoutMs: EXTRACT_TIMEOUT_MS,
		},
	);

	if (result.code !== 0) {
		throw new Error(`the hytale game package could not be unpacked — ${execDetail(result)}`);
	}

	await context.files.remove(GAME_ARCHIVE);

	if (!(await context.files.exists(SERVER_JAR)) || !(await context.files.exists(ASSETS_ARCHIVE))) {
		throw new Error(`the hytale game package is missing ${SERVER_JAR} or ${ASSETS_ARCHIVE}`);
	}
};
