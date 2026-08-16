import assert from "node:assert/strict";
import test from "node:test";

import { createRuntimeHandlers } from "../src/runtime.ts";

test("wires a Lambda runtime to the configured table and frontend origin", async () => {
  const commands: unknown[] = [];
  const handlers = createRuntimeHandlers({
    tableName: "prepped-dev-orders",
    allowedOrigins: ["https://prepped.chatgpt.site"],
    kioskBaseUrl: "https://prepped.chatgpt.site",
    draftTtlDays: 30,
  }, { send: async (command: unknown) => commands.push(command) });

  const response = await handlers.createDraft({
    body: JSON.stringify({ storeId: "mcdonald", items: [{ menuId: "101", quantity: 1 }] }),
    headers: { origin: "https://prepped.chatgpt.site" },
    requestContext: { requestId: "request-1" },
  });

  assert.equal(response.statusCode, 201);
  assert.equal(response.headers["access-control-allow-origin"], "https://prepped.chatgpt.site");
  assert.equal(commands.length, 1);
});
