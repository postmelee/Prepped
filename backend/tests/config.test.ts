import assert from "node:assert/strict";
import test from "node:test";

import { readRuntimeConfig } from "../src/runtime-config.ts";

test("reads trimmed CORS origins and runtime configuration", () => {
  const config = readRuntimeConfig({
    ORDER_TABLE_NAME: "prepped-dev-orders",
    CATALOG_TABLE_NAME: "prepped-dev-catalog",
    PREPPED_ALLOWED_ORIGINS: "https://prepped.chatgpt.site, http://localhost:3000 ",
    PREPPED_QR_BASE_URL: "https://prepped.chatgpt.site",
    DRAFT_TTL_DAYS: "30",
  });

  assert.deepEqual(config.allowedOrigins, ["https://prepped.chatgpt.site", "http://localhost:3000"]);
  assert.equal(config.tableName, "prepped-dev-orders");
  assert.equal(config.catalogTableName, "prepped-dev-catalog");
  assert.equal(config.kioskBaseUrl, "https://prepped.chatgpt.site");
  assert.equal(config.draftTtlDays, 30);
});

test("rejects a Lambda runtime without a table name", () => {
  assert.throws(
    () => readRuntimeConfig({
      PREPPED_ALLOWED_ORIGINS: "https://prepped.chatgpt.site",
      PREPPED_QR_BASE_URL: "https://prepped.chatgpt.site",
      CATALOG_TABLE_NAME: "prepped-dev-catalog",
    }),
    /ORDER_TABLE_NAME/,
  );
});
