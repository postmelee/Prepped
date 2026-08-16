import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("SAM template declares the catalog table, routes, handlers, and read-only policy", async () => {
  const template = await readFile(new URL("../template.yaml", import.meta.url), "utf8");

  assert.match(template, /CatalogTable:\n\s+Type: AWS::DynamoDB::Table/);
  assert.match(template, /CatalogTable:[\s\S]{0,160}TableName: !Sub prepped-\$\{StageName\}-catalog/);
  assert.match(template, /CATALOG_TABLE_NAME: !Ref CatalogTable/);
  assert.match(template, /Path: \/v1\/stores\n\s+Method: GET/);
  assert.match(template, /Path: \/v1\/stores\/\{storeId\}\/menus\n\s+Method: GET/);
  assert.match(template, /Path: \/v1\/menus\/\{menuId\}\n\s+Method: GET/);
  assert.match(template, /Path: \/v1\/catalog\/resolve\n\s+Method: POST/);
  assert.match(template, /Action:\n\s+- dynamodb:GetItem\n\s+- dynamodb:BatchGetItem\n\s+- dynamodb:Query/);
  assert.doesNotMatch(template, /PreppedCatalogTableReadAccess[\s\S]{0,400}dynamodb:(?:PutItem|UpdateItem|DeleteItem)/);
  assert.match(template, /CatalogApiFunctionRole:[\s\S]{0,800}PreppedCatalogTableReadAccess/);
  assert.match(template, /ListStoresFunction:[\s\S]{0,240}Role: !GetAtt CatalogApiFunctionRole\.Arn/);
  assert.doesNotMatch(template, /CatalogApiFunctionRole:[\s\S]{0,800}dynamodb:(?:PutItem|TransactWriteItems)/);
});
