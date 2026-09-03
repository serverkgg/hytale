export const MAVEN_BASE = "https://maven.hytale.com/release/com/hypixel/hytale/Server";

export const MAVEN_METADATA_URL = `${MAVEN_BASE}/maven-metadata.xml`;

export const METADATA_CACHE_SECONDS = 900;

const RELEASE = /<release>\s*(?<version>[^<\s][^<]*?)\s*<\/release>/;

const LATEST = /<latest>\s*(?<version>[^<\s][^<]*?)\s*<\/latest>/;

const VERSIONS = /<version>\s*(?<version>[^<\s][^<]*?)\s*<\/version>/g;

const SHA1 = /\b(?<digest>[0-9a-f]{40})\b/;

const SAFE_VERSION = /^[0-9A-Za-z][0-9A-Za-z._-]{0,63}$/;

export interface HytaleRelease {
	release: string | null;
	versions: string[];
}

export const parseMavenMetadata = (xml: string): HytaleRelease => {
	const versions = [
		...xml.matchAll(VERSIONS),
	]
		.map((match) => match.groups?.version ?? "")
		.filter((version) => SAFE_VERSION.test(version));

	const declared = (xml.match(RELEASE)?.groups?.version ?? xml.match(LATEST)?.groups?.version ?? "").trim();

	const release = SAFE_VERSION.test(declared) ? declared : (versions.at(-1) ?? null);

	return {
		release,
		versions,
	};
};

export const parseMavenDigest = (raw: string): string | null => {
	const digest = raw.match(SHA1)?.groups?.digest;

	return digest === undefined ? null : `sha1:${digest}`;
};

export const jarUrl = (version: string) => {
	return `${MAVEN_BASE}/${version}/Server-${version}.jar`;
};

export const digestUrl = (version: string) => {
	return `${jarUrl(version)}.sha1`;
};
