import { afterEach, describe, expect, it } from "bun:test";
import { type Bridge, BridgeUserError } from "@serverkgg/bridge";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { AUTH_LOGIN_COMMAND, AUTH_STATUS_COMMAND } from "../shared";
import { setup } from "./setup";
import { CANCEL_ACTION, DOWNLOAD_STEP, RENEW_ACTION, RETRY_ACTION, SIGN_IN_STEP, stopSetup } from "./setupFlow";

const DEVICE_CODE = "FnM4EEUw";

const DEVICE_LINES = [
	`Visit https://oauth.accounts.hytale.com/oauth2/device/verify?user_code=${DEVICE_CODE} to sign in`,
	"The code expires in 599 seconds",
];

interface SubmitHarness {
	context: Bridge.Context;
	reported: Bridge.Activity[];
}

const submitHarness = (): SubmitHarness => {
	const reported: Bridge.Activity[] = [];
	const lines: string[] = [];

	const context = {
		files: {
			async exists() {
				return false;
			},
		},

		logs: {
			async tail() {
				return [
					...lines,
				];
			},

			follow() {
				return () => {
					return;
				};
			},
		},

		async command(input: string) {
			if (input === AUTH_STATUS_COMMAND) {
				lines.push("Not authenticated");
			}

			if (input === AUTH_LOGIN_COMMAND) {
				lines.push(...DEVICE_LINES);
			}
		},

		setup: {
			report() {
				return;
			},

			clear() {
				return;
			},
		},

		activity: {
			report(entry: Bridge.Activity) {
				reported.push(entry);
			},
		},

		log: Object.assign(
			() => {
				return;
			},
			{
				warn: () => {
					return;
				},
			},
		),
	};

	return {
		context: context as unknown as Bridge.Context,
		reported,
	};
};

const submit = async (step: string, action: string) => {
	const { context, reported } = submitHarness();

	await setup.submit?.(context, step, action, {});

	return reported;
};

describe("telling the owner which setup button was pressed", () => {
	afterEach(() => {
		stopSetup();
	});

	it("says a new sign-in code was requested, without the code or its link", async () => {
		const reported = await submit(SIGN_IN_STEP, RENEW_ACTION);

		expect(reported).toEqual([
			{
				name: BridgeEventName.SetupAction,
				text: {
					ar: "تم طلب رمز دخول جديد لهايتيل",
					en: "Requested a new Hytale sign-in code",
				},
				details: {
					step: SIGN_IN_STEP,
					action: RENEW_ACTION,
				},
			},
		]);
		expect(JSON.stringify(reported)).not.toContain(DEVICE_CODE);
		expect(JSON.stringify(reported)).not.toContain("https://");
	});

	it("says the sign-in was cancelled", async () => {
		const reported = await submit(SIGN_IN_STEP, CANCEL_ACTION);

		expect(
			reported.map((entry) => [
				entry.name,
				entry.text.en,
				entry.details?.action,
			]),
		).toEqual([
			[
				BridgeEventName.SetupAction,
				"Canceled the Hytale sign-in",
				CANCEL_ACTION,
			],
		]);
	});

	it("says which step was retried", async () => {
		const signIn = await submit(SIGN_IN_STEP, RETRY_ACTION);

		stopSetup();

		const download = await submit(DOWNLOAD_STEP, RETRY_ACTION);

		expect(signIn.at(0)?.text.en).toBe("Restarted the Hytale sign-in");
		expect(signIn.at(0)?.details).toEqual({
			step: SIGN_IN_STEP,
			action: RETRY_ACTION,
		});
		expect(download.at(0)?.text.en).toBe("Restarted the Hytale game file download");
		expect(download.at(0)?.details).toEqual({
			step: DOWNLOAD_STEP,
			action: RETRY_ACTION,
		});
	});

	it("reports nothing for a button it refuses, because the runtime reports the refusal", async () => {
		const { context, reported } = submitHarness();

		await expect(setup.submit?.(context, DOWNLOAD_STEP, RENEW_ACTION, {})).rejects.toBeInstanceOf(BridgeUserError);
		expect(reported).toEqual([]);
	});
});
