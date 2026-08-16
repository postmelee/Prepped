import assert from "node:assert/strict";
import test from "node:test";

import { handleLocalCatalogRequest } from "../shared/catalog/local-api.ts";

async function payload(path, init) {
  const response = await handleLocalCatalogRequest(new Request(`https://prepped.test${path}`, init));
  return { response, body: await response.json() };
}

test("same-origin catalog API lists three stores and paginates real menus", async () => {
  const stores = await payload("/api/catalog/stores");
  const firstPage = await payload("/api/catalog/stores/starbucks/menus?limit=20");
  const secondPage = await payload(`/api/catalog/stores/starbucks/menus?limit=20&cursor=${firstPage.body.data.nextCursor}`);

  assert.equal(stores.response.status, 200);
  assert.deepEqual(stores.body.data.stores.map((store) => store.id), ["mcdonald", "subway", "starbucks"]);
  assert.equal(firstPage.body.data.menus.length, 20);
  assert.equal(firstPage.body.data.nextCursor, "20");
  assert.equal(secondPage.body.data.menus.length, 20);
  assert.notEqual(secondPage.body.data.menus[0].id, firstPage.body.data.menus[0].id);
});

test("same-origin catalog API filters categories and returns menu customization", async () => {
  const filtered = await payload("/api/catalog/stores/subway/menus?category=sandwich&limit=200");
  const menuId = filtered.body.data.menus[0].id;
  const detail = await payload(`/api/catalog/menus/${menuId}`);

  assert.equal(filtered.response.status, 200);
  assert.equal(filtered.body.data.menus.length, 50);
  assert.ok(filtered.body.data.menus.every((menu) => menu.categoryId === "sandwich"));
  assert.equal(detail.response.status, 200);
  assert.ok(detail.body.data.menu.optionGroups.some((group) => group.id === "subway-bread"));
});

test("same-origin resolve API keeps request order and isolates the selected store", async () => {
  const resolved = await payload("/api/catalog/resolve", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      storeId: "mcdonald",
      menuIds: ["starbucks-94", "mcdonald-178", "missing-menu", "mcdonald-178"],
    }),
  });

  assert.equal(resolved.response.status, 200);
  assert.deepEqual(resolved.body.data.menus.map((menu) => menu.id), ["mcdonald-178"]);
  assert.deepEqual(resolved.body.data.unknownMenuIds, ["starbucks-94", "missing-menu"]);
});

test("same-origin catalog API returns stable validation errors", async () => {
  const badLimit = await payload("/api/catalog/stores/mcdonald/menus?limit=999");
  const badCategory = await payload("/api/catalog/stores/mcdonald/menus?category=espresso");
  const missing = await payload("/api/catalog/menus/mcdonald-missing");

  assert.equal(badLimit.response.status, 400);
  assert.equal(badLimit.body.error.code, "VALIDATION_ERROR");
  assert.equal(badCategory.response.status, 400);
  assert.equal(missing.response.status, 404);
  assert.equal(missing.body.error.code, "MENU_NOT_FOUND");
});
