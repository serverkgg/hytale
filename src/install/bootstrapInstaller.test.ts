import { describe, expect, test } from "bun:test";
import { BridgeDownloadError, BridgeNetError, BridgeUserError } from "@serverkgg/bridge";
import { installerFailure, UNREACHABLE } from "./bootstrapInstaller";

const SUBJECT = "HytaleServer.jar 2026.01.24";

describe("installerFailure", () => {
	test("keeps the unreachable text and the original error when no answer came back", () => {
		const cause = new BridgeNetError(null, "ECONNREFUSED maven.hytale.com");
		const error = installerFailure(cause, SUBJECT);

		expect(error).toBeInstanceOf(BridgeUserError);
		expect(error.text).toEqual(UNREACHABLE);
		expect(error.cause).toBe(cause);
	});

	test("says the release is gone when maven answers 404", () => {
		const cause = new BridgeDownloadError(404, "not found");
		const error = installerFailure(cause, SUBJECT);

		expect(error.text.en).toBe("HytaleServer.jar 2026.01.24 is no longer available from its source.");
		expect(error.cause).toBe(cause);
	});

	test("says the download failed for anything else", () => {
		expect(installerFailure(new Error("digest mismatch"), SUBJECT).text.en).toBe(
			"We could not download HytaleServer.jar 2026.01.24. Try again.",
		);
	});
});
