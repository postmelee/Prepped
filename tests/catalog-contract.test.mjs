import assert from "node:assert/strict";
import test from "node:test";

import { assertCatalogSnapshot, collectCatalogErrors, QR_SAFE_ID } from "../shared/catalog/schema.ts";
import { STORE_KEYS } from "../shared/catalog/types.ts";

const collectedAt = "2026-08-16T06:00:00Z";

function validCatalog() {
  return {
    version: "2026-08-16",
    locale: "ko-KR",
    collectedAt,
    stores: STORE_KEYS.map((id, sortOrder) => ({
      id,
      name: id,
      shortName: id,
      sortOrder,
      sourceUrl: `https://example.com/${id}`,
    })),
    categories: [
      { id: "burger", storeId: "mcdonald", name: "버거", sortOrder: 1 },
    ],
    optionGroups: [
      {
        id: "mcdonald-serving",
        storeId: "mcdonald",
        name: "구성",
        selectionMode: "single",
        minSelections: 1,
        maxSelections: 1,
        values: [
          { id: "single", name: "단품", priceDelta: 0, isDefault: true },
          { id: "set", name: "세트", priceDelta: 2200 },
        ],
      },
    ],
    menus: [
      {
        id: "mcdonald-big-mac",
        storeId: "mcdonald",
        categoryId: "burger",
        baseProductId: "178",
        name: "빅맥",
        price: { amount: 6300, currency: "KRW", type: "estimated" },
        optionGroupIds: ["mcdonald-serving"],
        source: {
          provider: "mcdonald",
          productId: "178",
          productUrl: "https://www.mcdonalds.co.kr/kor/menu/detail.do?seq=178",
          imageUsage: "reference-only",
          collectedAt,
        },
        isAvailable: true,
        sortOrder: 1,
      },
    ],
  };
}

test("accepts a catalog with stable QR-safe IDs and linked options", () => {
  const catalog = validCatalog();
  assert.doesNotThrow(() => assertCatalogSnapshot(catalog));
  assert.equal(QR_SAFE_ID.test(catalog.menus[0].id), true);
});

test("reports duplicate, cross-store, option, and price contract failures", () => {
  const catalog = validCatalog();
  catalog.menus.push({
    ...catalog.menus[0],
    storeId: "subway",
    categoryId: "burger",
    price: { amount: -1, currency: "KRW", type: "estimated" },
    optionGroupIds: ["missing-option"],
    source: { ...catalog.menus[0].source, provider: "mcdonald" },
  });

  const errors = collectCatalogErrors(catalog);
  assert.ok(errors.some((error) => error.includes("duplicates")));
  assert.ok(errors.some((error) => error.includes("categoryId is unknown")));
  assert.ok(errors.some((error) => error.includes("non-negative integer")));
  assert.ok(errors.some((error) => error.includes("missing-option")));
  assert.ok(errors.some((error) => error.includes("provider must match")));
});

test("rejects an incomplete catalog before reading nested arrays", () => {
  assert.deepEqual(collectCatalogErrors({ version: "x", locale: "ko-KR", collectedAt }), [
    "catalog.stores must be an array",
    "catalog.categories must be an array",
    "catalog.optionGroups must be an array",
    "catalog.menus must be an array",
  ]);
});
