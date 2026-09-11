import { createHmac } from "crypto";

const INIT_DATA_MAX_AGE_SECONDS = 24 * 60 * 60;

export type TelegramInitDataUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

export type ValidatedInitData = {
  user: TelegramInitDataUser | null;
  authDate: number;
};

// Rasmiy Telegram Mini App initData tekshiruv algoritmi:
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
export function validateTelegramInitData(
  initDataRaw: string,
  botToken: string
): ValidatedInitData | null {
  const params = new URLSearchParams(initDataRaw);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (computedHash !== hash) return null;

  const authDateStr = params.get("auth_date");
  const authDate = authDateStr ? parseInt(authDateStr, 10) : 0;
  if (!authDate || Date.now() / 1000 - authDate > INIT_DATA_MAX_AGE_SECONDS) {
    return null;
  }

  let user: TelegramInitDataUser | null = null;
  const userStr = params.get("user");
  if (userStr) {
    try {
      user = JSON.parse(userStr) as TelegramInitDataUser;
    } catch {
      user = null;
    }
  }

  return { user, authDate };
}

export function isAdminUserId(userId: number | undefined | null): boolean {
  if (!userId) return false;
  const adminIds = (process.env.ADMIN_TELEGRAM_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return adminIds.includes(String(userId));
}

// Respondent endpointlari uchun: initData bo'lsa tekshiradi (soxta bo'lsa null),
// bo'lmasa null qaytaradi — token o'zi maxfiy kalit sifatida ishlatiladi (TZ 8.2).
export function readValidatedInitData(req: Request): ValidatedInitData | null | "invalid" {
  const initDataRaw = req.headers.get("x-telegram-init-data");
  if (!initDataRaw) return null;

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return "invalid";

  const validated = validateTelegramInitData(initDataRaw, botToken);
  return validated ?? "invalid";
}

// Admin endpointlari uchun: initData MAJBURIY va foydalanuvchi ADMIN_TELEGRAM_IDS
// ro'yxatida bo'lishi kerak (TZ 8.2, T9). Aks holda null — chaqiruvchi 403 qaytaradi.
export function getAdminUserId(req: Request): number | null {
  const result = readValidatedInitData(req);
  if (result === "invalid" || result === null) return null;
  const userId = result.user?.id;
  if (!isAdminUserId(userId)) return null;
  return userId as number;
}
