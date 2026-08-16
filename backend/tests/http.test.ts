import assert from "node:assert/strict";
import test from "node:test";

import { DraftService, InMemoryDraftRepository } from "../src/domain/drafts.ts";
import { createHttpHandlers } from "../src/http/handlers.ts";

function createHandlers() {
  const service = new DraftService({
    repository: new InMemoryDraftRepository(),
    tokenFactory: () => "http-draft-token-abcdefghijklmnopqrstuvwxyz012345678",
    orderIdFactory: () => "ord_test",
    clock: () => new Date("2026-08-16T05:00:00Z"),
    kioskBaseUrl: "https://kiosk.prepped.example",
  });
  return createHttpHandlers(service, ["https://prepped.chatgpt.site"]);
}

function event(input: {
  body?: unknown;
  pathParameters?: Record<string, string>;
  headers?: Record<string, string>;
}) {
  return {
    body: input.body === undefined ? null : JSON.stringify(input.body),
    pathParameters: input.pathParameters ?? {},
    headers: input.headers ?? { origin: "https://prepped.chatgpt.site" },
    requestContext: { requestId: "request-1" },
  };
}

test("create handler returns a 201 server-priced draft with CORS", async () => {
  const handlers = createHandlers();

  const response = await handlers.createDraft(event({
    body: { storeId: "mcdonald", items: [{ menuId: "103", quantity: 1, optionIds: ["single"] }] },
  }));

  assert.equal(response.statusCode, 201);
  assert.equal(response.headers["access-control-allow-origin"], "https://prepped.chatgpt.site");
  const payload = JSON.parse(response.body);
  assert.equal(payload.data.draft.totalPrice, 7200);
  assert.equal(payload.data.qrPayload, "https://kiosk.prepped.example/kiosk?draft=http-draft-token-abcdefghijklmnopqrstuvwxyz012345678");
});

test("get handler returns 404 without revealing an unknown token", async () => {
  const handlers = createHandlers();

  const response = await handlers.getDraft(event({ pathParameters: { token: "missing-token" } }));

  assert.equal(response.statusCode, 404);
  assert.deepEqual(JSON.parse(response.body).error.code, "DRAFT_NOT_FOUND");
});

test("complete handler returns 201 then replays the same idempotency key", async () => {
  const handlers = createHandlers();
  const createResponse = await handlers.createDraft(event({
    body: { storeId: "mcdonald", items: [{ menuId: "101", quantity: 1 }] },
  }));
  const token = JSON.parse(createResponse.body).data.draft.token;
  const request = event({
    pathParameters: { token },
    body: { paymentMethod: "demo" },
    headers: {
      origin: "https://prepped.chatgpt.site",
      "idempotency-key": "b3e1f23a-c83f-4f0f-bbe5-8db3175431a1",
    },
  });

  const created = await handlers.completeDraft(request);
  const replayed = await handlers.completeDraft(request);

  assert.equal(created.statusCode, 201);
  assert.equal(replayed.statusCode, 200);
  assert.equal(JSON.parse(replayed.body).data.idempotentReplay, true);
});

test("create handler rejects malformed JSON body with a retry-safe error", async () => {
  const handlers = createHandlers();

  const response = await handlers.createDraft({
    ...event({}),
    body: "{invalid",
  });

  assert.equal(response.statusCode, 400);
  const payload = JSON.parse(response.body);
  assert.equal(payload.error.code, "VALIDATION_ERROR");
  assert.equal(payload.error.retryable, false);
});
