import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { PLAYER_DIED, PLAYER_JOINED, PLAYER_LEFT, SERVER_READY } from "../shared";

const CRASHED = /\bException in thread "main"\b|\bFATAL\b.*\bshutting down\b/;

const PORT_BIND_FAILED = /Address already in use|Failed to bind/i;

const WRONG_JAVA = /UnsupportedClassVersionError|has been compiled by a more recent version of the Java Runtime/;

const MEMORY_UNDERSIZED = /java\.lang\.OutOfMemoryError/;

export const events: Bridge.Events = {
	kind: BridgeKind.Events,
	patterns: [
		{
			match: SERVER_READY,
			emit: "ServerStarted",
		},
		{
			match: PLAYER_JOINED,
			emit: "PlayerJoined",
		},
		{
			match: PLAYER_LEFT,
			emit: "PlayerLeft",
		},
		{
			match: PLAYER_DIED,
			emit: "PlayerDied",
		},
		{
			match: CRASHED,
			emit: "ServerCrashed",
		},
		{
			match: PORT_BIND_FAILED,
			emit: "PortBindFailed",
		},
		{
			match: WRONG_JAVA,
			emit: "WrongJavaVersion",
		},
		{
			match: MEMORY_UNDERSIZED,
			emit: "MemoryUndersized",
		},
	],
	emits: [
		"ServerStopping",
	],
};
