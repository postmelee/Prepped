import { randomUUID } from "node:crypto";

const apiBaseUrl = process.env.API_BASE_URL?.replace(/\/$/, "");
const origin = process.env.SMOKE_TEST_ORIGIN;

if (!apiBaseUrl) throw new Error("API_BASE_URL 환경 변수가 필요합니다.");
if (!origin) throw new Error("SMOKE_TEST_ORIGIN 환경 변수가 필요합니다.");

async function request(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      origin,
      ...(options.headers ?? {}),
    },
  });
  const payload = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new Error(`${options.method ?? "GET"} ${path} 실패: HTTP ${response.status}`);
  }
  if (response.headers.get("access-control-allow-origin") !== origin) {
    throw new Error(`${path} 응답의 CORS Origin이 일치하지 않습니다.`);
  }
  return { response, payload };
}

async function preflight(path, requestedHeaders = "content-type") {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "OPTIONS",
    headers: {
      origin,
      "access-control-request-method": "POST",
      "access-control-request-headers": requestedHeaders,
    },
  });
  if (!response.ok) throw new Error(`OPTIONS ${path} 실패: HTTP ${response.status}`);
  if (response.headers.get("access-control-allow-origin") !== origin) {
    throw new Error(`${path} preflight 응답의 CORS Origin이 일치하지 않습니다.`);
  }
  const allowedMethods = response.headers.get("access-control-allow-methods")?.toLowerCase() ?? "";
  if (!allowedMethods.includes("post")) throw new Error(`${path} preflight에 POST가 허용되지 않았습니다.`);
  const allowedHeaders = response.headers.get("access-control-allow-headers")?.toLowerCase() ?? "";
  for (const header of requestedHeaders.split(",").map((value) => value.trim()).filter(Boolean)) {
    if (!allowedHeaders.includes(header)) throw new Error(`${path} preflight에 ${header} 헤더가 허용되지 않았습니다.`);
  }
}

const health = await request("/v1/health");
if (health.payload?.data?.status !== "ok") throw new Error("health 응답이 올바르지 않습니다.");

await preflight("/v1/drafts");
await preflight("/v1/drafts/example-token/complete", "content-type,idempotency-key");

const created = await request("/v1/drafts", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    storeId: "mcdonald",
    items: [{ menuId: "101", quantity: 1 }],
  }),
});
const token = created.payload?.data?.draft?.token;
if (typeof token !== "string") throw new Error("주문 초안 토큰을 받지 못했습니다.");

const restored = await request(`/v1/drafts/${encodeURIComponent(token)}`);
if (restored.payload?.data?.draft?.totalPrice !== 6300) throw new Error("복원된 주문 합계가 올바르지 않습니다.");

const completionHeaders = {
  "content-type": "application/json",
  "idempotency-key": randomUUID(),
};
const completed = await request(`/v1/drafts/${encodeURIComponent(token)}/complete`, {
  method: "POST",
  headers: completionHeaders,
  body: JSON.stringify({ paymentMethod: "demo" }),
});
if (completed.payload?.data?.order?.status !== "COMPLETED") throw new Error("주문 완료 기록을 만들지 못했습니다.");

const replay = await request(`/v1/drafts/${encodeURIComponent(token)}/complete`, {
  method: "POST",
  headers: completionHeaders,
  body: JSON.stringify({ paymentMethod: "demo" }),
});
if (replay.payload?.data?.idempotentReplay !== true) throw new Error("완료 요청의 멱등 재시도가 동작하지 않습니다.");

const reusable = await request(`/v1/drafts/${encodeURIComponent(token)}`);
if (reusable.payload?.data?.draft?.token !== token) throw new Error("완료 뒤 초안이 재사용되지 않습니다.");

console.log("스모크 테스트 통과: health, CORS preflight, 생성, 복원, 완료, 멱등 재시도, QR 재사용");
