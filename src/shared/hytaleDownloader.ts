import type { Bridge } from "@serverkgg/bridge";

export const DOWNLOADER_BINARY = "/opt/hytale/hytale-downloader";

export const CREDENTIALS_FILE = ".hytale-downloader-credentials.json";

export const CREDENTIALS_SECRET = "HYTALE_DOWNLOADER_CREDENTIALS";

export const PATCHLINE = "release";

export const GAME_ARCHIVE = ".serverk-game.zip";

const OUTPUT_DETAIL = 800;

const VERSION = /^[0-9A-Za-z][0-9A-Za-z._-]{2,63}$/;

const NOT_A_VERSION = /error|failed|authenticate|unauthor|forbidden|expired|invalid|http|please visit/i;

export const NEEDS_AUTHENTICATION = /Please visit the following URL to authenticate|user_code=/;

export const CREDENTIAL_REJECTED =
	/invalid_grant|refresh token is (?:malformed|invalid)|error loading saved session|\bunauthorized\b|\b40[13]\b/i;

const tail = (text: string) => {
	return text.trim().slice(-OUTPUT_DETAIL);
};

export const execDetail = (result: Bridge.ExecResult) => {
	return [
		tail(result.stdout),
		tail(result.stderr),
	]
		.filter((part) => part.length > 0)
		.join(" | ");
};

export const parsePrintedVersion = (stdout: string): string | null => {
	const lines = stdout
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	for (const line of lines.toReversed()) {
		if (VERSION.test(line) && !NOT_A_VERSION.test(line)) {
			return line;
		}
	}

	return null;
};
