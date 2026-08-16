export type RuntimeConfig = {
  tableName: string;
  allowedOrigins: string[];
  kioskBaseUrl: string;
  draftTtlDays: number;
};

export function readRuntimeConfig(environment: Record<string, string | undefined>): RuntimeConfig {
  const tableName = environment.ORDER_TABLE_NAME?.trim();
  if (!tableName) throw new Error("ORDER_TABLE_NAME 환경 변수가 필요합니다.");

  const kioskBaseUrl = environment.PREPPED_QR_BASE_URL?.trim();
  if (!kioskBaseUrl) throw new Error("PREPPED_QR_BASE_URL 환경 변수가 필요합니다.");

  const allowedOrigins = (environment.PREPPED_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (allowedOrigins.length === 0) throw new Error("PREPPED_ALLOWED_ORIGINS 환경 변수가 필요합니다.");

  const configuredTtl = Number.parseInt(environment.DRAFT_TTL_DAYS ?? "30", 10);
  const draftTtlDays = Number.isInteger(configuredTtl) && configuredTtl > 0 && configuredTtl <= 365 ? configuredTtl : 30;

  return { tableName, allowedOrigins, kioskBaseUrl, draftTtlDays };
}
