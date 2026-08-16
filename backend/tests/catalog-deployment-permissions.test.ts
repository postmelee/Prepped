import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("CloudFormation execution role can manage only named Prepped catalog tables", async () => {
  const bootstrap = await readFile(new URL("../infra/github-oidc-bootstrap.yaml", import.meta.url), "utf8");

  assert.match(bootstrap, /table\/prepped-\*-catalog/);
  assert.match(bootstrap, /role\/prepped-\*-catalog-api-lambda/);
  assert.doesNotMatch(bootstrap, /dynamodb:BatchWriteItem/);
});
