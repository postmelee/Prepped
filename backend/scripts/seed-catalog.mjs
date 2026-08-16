import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

import { buildCatalogDynamoItems, CATALOG_COUNTS, CATALOG_VERSION } from "../../shared/catalog/data/index.ts";

const MAX_BATCH_SIZE = 25;
const MAX_RETRIES = 5;

function chunks(values, size) {
  return Array.from({ length: Math.ceil(values.length / size) }, (_, index) =>
    values.slice(index * size, (index + 1) * size));
}

export function prepareCatalogSeed() {
  const items = buildCatalogDynamoItems();
  const identities = new Set(items.map((item) => `${item.pk}\0${item.sk}`));
  assert.equal(identities.size, items.length, "catalog seed contains duplicate DynamoDB keys");
  return items;
}

async function applyCatalogSeed(tableName, items) {
  const [{ DynamoDBClient }, { BatchWriteCommand, DynamoDBDocumentClient }] = await Promise.all([
    import("@aws-sdk/client-dynamodb"),
    import("@aws-sdk/lib-dynamodb"),
  ]);
  const client = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
    marshallOptions: { removeUndefinedValues: true },
  });
  let written = 0;
  for (const batch of chunks(items, MAX_BATCH_SIZE)) {
    let pending = batch.map((Item) => ({ PutRequest: { Item } }));
    for (let attempt = 0; pending.length > 0; attempt += 1) {
      if (attempt >= MAX_RETRIES) throw new Error(`UnprocessedItems remained after ${MAX_RETRIES} attempts`);
      const result = await client.send(new BatchWriteCommand({ RequestItems: { [tableName]: pending } }));
      pending = result.UnprocessedItems?.[tableName] ?? [];
      if (pending.length > 0) await new Promise((resolve) => setTimeout(resolve, 100 * (2 ** attempt)));
    }
    written += batch.length;
    process.stdout.write(`catalog seed ${written}/${items.length}\n`);
  }
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry-run");
  const apply = args.has("--apply");
  if (dryRun === apply) {
    throw new Error("Usage: node scripts/seed-catalog.mjs --dry-run | --apply");
  }
  const items = prepareCatalogSeed();
  const summary = {
    version: CATALOG_VERSION,
    storeCounts: CATALOG_COUNTS,
    dynamoItems: items.length,
  };
  if (dryRun) {
    process.stdout.write(`${JSON.stringify(summary)}\n`);
    return;
  }
  const tableName = process.env.CATALOG_TABLE_NAME;
  if (!tableName) throw new Error("CATALOG_TABLE_NAME is required with --apply");
  await applyCatalogSeed(tableName, items);
  process.stdout.write(`catalog seed completed ${JSON.stringify(summary)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
