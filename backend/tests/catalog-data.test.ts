import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCatalogDynamoItems,
  CATALOG_COUNTS,
  CATALOG_MENU_DETAILS,
  CATALOG_SNAPSHOT,
} from "../../shared/catalog/data/index.ts";
import { QR_SAFE_ID, assertCatalogSnapshot } from "../../shared/catalog/schema.ts";

test("real-menu snapshot validates and keeps the reviewed store counts", () => {
  assert.doesNotThrow(() => assertCatalogSnapshot(CATALOG_SNAPSHOT));
  assert.deepEqual(CATALOG_COUNTS, { mcdonald: 91, subway: 93, starbucks: 311 });
  assert.equal(CATALOG_SNAPSHOT.menus.length, 495);
  assert.equal(new Set(CATALOG_SNAPSHOT.menus.map((menu) => menu.id)).size, 495);
  assert.ok(CATALOG_SNAPSHOT.menus.every((menu) => QR_SAFE_ID.test(menu.id)));
});

test("source images stay on reviewed official hosts without vendored binaries", () => {
  const allowedHosts = new Set([
    "www.mcdonalds.co.kr",
    "www.subway.co.kr",
    "image.istarbucks.co.kr",
  ]);
  CATALOG_SNAPSHOT.menus.forEach((menu) => {
    assert.equal(menu.source.imageUsage, "reference-only");
    assert.ok(menu.source.imageUrl);
    assert.ok(allowedHosts.has(new URL(menu.source.imageUrl).hostname), menu.source.imageUrl);
  });
});

test("prices distinguish reviewed official values from estimates", () => {
  const eggMayo15 = CATALOG_SNAPSHOT.menus.find((menu) =>
    menu.storeId === "subway" && menu.baseProductId === "1530" && menu.variant?.label === "15cm");
  const eggMayo30 = CATALOG_SNAPSHOT.menus.find((menu) =>
    menu.storeId === "subway" && menu.baseProductId === "1530" && menu.variant?.label === "30cm");
  assert.deepEqual([eggMayo15?.price.amount, eggMayo30?.price.amount], [6200, 11800]);
  assert.equal(eggMayo15?.price.type, "official");
  assert.ok(CATALOG_SNAPSHOT.menus
    .filter((menu) => menu.storeId === "mcdonald" || menu.storeId === "starbucks")
    .every((menu) => menu.price.type === "estimated"));
});

test("menu details resolve every declared customization group", () => {
  const groupIds = new Set(CATALOG_SNAPSHOT.optionGroups.map((group) => group.id));
  CATALOG_MENU_DETAILS.forEach((menu) => {
    assert.deepEqual(menu.optionGroups.map((group) => group.id), menu.optionGroupIds);
    assert.ok(menu.optionGroupIds.every((id) => groupIds.has(id)));
  });
  assert.ok(CATALOG_MENU_DETAILS.some((menu) => menu.optionGroupIds.includes("subway-bread")));
  assert.ok(CATALOG_MENU_DETAILS.some((menu) => menu.optionGroupIds.includes("starbucks-size")));
  assert.ok(CATALOG_MENU_DETAILS.some((menu) => menu.optionGroupIds.includes("mcdonald-serving")));
});

test("DynamoDB seed contains one manifest, stores, categories, and two projections per menu", () => {
  const items = buildCatalogDynamoItems();
  assert.equal(items.length, 1 + 3 + 28 + 495 * 2);
  assert.equal(new Set(items.map((item) => `${item.pk}\0${item.sk}`)).size, items.length);
  assert.equal(items.filter((item) => item.entity === "MENU_LIST").length, 495);
  assert.equal(items.filter((item) => item.entity === "MENU_LOOKUP").length, 495);
});
