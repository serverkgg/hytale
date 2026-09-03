import type { Bridge } from "@serverkgg/bridge";
import { CREDENTIALS_FILE, CREDENTIALS_SECRET } from "../shared";

export const MISSING_SECRET = [
	`سيرفرات هايتيل تحتاج بيانات اعتماد أداة التحميل الرسمية، والمنصة ما عندها وحدة الحين. أضف السر ${CREDENTIALS_SECRET} من لوحة الإدارة وأعد التثبيت.`,
	`hytale servers need the official downloader credentials and the platform has none. Add the ${CREDENTIALS_SECRET} secret from the admin panel and reinstall.`,
].join(" — ");

export const INVALID_SECRET = [
	`قيمة السر ${CREDENTIALS_SECRET} مو JSON صالح. الصق محتوى ملف ${CREDENTIALS_FILE} كامل زي ما هو.`,
	`the ${CREDENTIALS_SECRET} secret is not valid JSON. Paste the whole ${CREDENTIALS_FILE} file exactly as it is.`,
].join(" — ");

export const STALE_CREDENTIALS = [
	`أداة تحميل هايتيل ما قبلت بيانات الاعتماد المخزّنة. جدّد السر ${CREDENTIALS_SECRET} بتسجيل دخول جديد على حساب هايتيل.`,
	`the hytale downloader refused the stored credentials. Refresh the ${CREDENTIALS_SECRET} secret with a fresh device login on the hytale account.`,
].join(" — ");

const REQUIRED_KEYS = [
	"access_token",
	"refresh_token",
];

export const parseCredentials = (raw: string): string | null => {
	const trimmed = raw.trim();

	if (trimmed.length === 0) {
		return null;
	}

	let parsed: unknown;

	try {
		parsed = JSON.parse(trimmed);
	} catch {
		return null;
	}

	if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
		return null;
	}

	const record = parsed as Record<string, unknown>;

	if (!REQUIRED_KEYS.every((key) => typeof record[key] === "string" && String(record[key]).length > 0)) {
		return null;
	}

	return `${JSON.stringify(record, null, 2)}\n`;
};

export const seedCredentials = async (context: Bridge.Context, replace: boolean) => {
	const secret = context.secret(CREDENTIALS_SECRET) ?? "";

	if (secret.trim().length === 0) {
		throw new Error(MISSING_SECRET);
	}

	const contents = parseCredentials(secret);

	if (contents === null) {
		throw new Error(INVALID_SECRET);
	}

	if (!replace && (await context.files.exists(CREDENTIALS_FILE))) {
		return false;
	}

	await context.files.write(CREDENTIALS_FILE, contents);

	return true;
};
