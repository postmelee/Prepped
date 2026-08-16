import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("SAM template declares the catalog table, routes, handlers, and read-only policy", async () => {
  const template = await readFile(new URL("../template.yaml", import.meta.url), "utf8");

  assert.match(template, /CatalogTable:\n\s+Type: AWS::DynamoDB::Table/);
  assert.match(template, /CATALOG_TABLE_NAME: !Ref CatalogTable/);
  assert.match(template, /Path: \/v1\/stores\n\s+Method: GET/);
  assert.match(template, /Path: \/v1\/stores\/\{storeId\}\/menus\n\s+Method: GET/);
  assert.match(template, /Path: \/v1\/menus\/\{menuId\}\n\s+Method: GET/);
  assert.match(template, /Path: \/v1\/catalog\/resolve\n\s+Method: POST/);
  assert.match(template, /Action: \[dynamodb:GetItem, dynamodb:BatchGetItem, dynamodb:Query\]/);
  assert.doesNotMatch(template, /CatalogTableReadPolicy[\s\S]{0,400}dynamodb:(?:PutItem|UpdateItem|DeleteItem)/);
});
