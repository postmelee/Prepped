import assert from "node:assert/strict";
import test from "node:test";

import { CatalogError } from "../src/catalog/domain.ts";
import { InMemoryCatalogRepository } from "../src/catalog/repository.ts";
import { CatalogService } from "../src/catalog/service.ts";
import { catalogManifest, catalogMenus, catalogSnapshot } from "./catalog-test-data.ts";

function createService() {
  return new CatalogService(new InMemoryCatalogRepository({
    manifest: catalogManifest,
    stores: catalogSnapshot.stores,
    categories: catalogSnapshot.categories,
    menus: catalogMenus,
  }));
}

test("lists stores with categories and catalog version", async () => {
  const result = await createService().listStores();
  assert.deepEqual(result.stores.map((store) => store.id), ["mcdonald", "subway", "starbucks"]);
  assert.equal(result.stores[0].categories[0].id, "burger");
  assert.equal(result.catalogVersion, "2026-08-16");
});

test("lists a store menu as summaries without expanded options", async () => {
  const result = await createService().listMenus({ storeId: "mcdonald", categoryId: "burger" });
  assert.deepEqual(result.menus.map((menu) => menu.id), ["mcdonald-big-mac"]);
  assert.equal("optionGroups" in result.menus[0], false);
  assert.equal(result.nextCursor, null);
});

test("resolves only the selected store in request order and reports unknown IDs", async () => {
  const result = await createService().resolveMenus({
    storeId: "mcdonald",
    menuIds: ["unknown-id", "mcdonald-big-mac", "starbucks-caffe-americano-hot", "mcdonald-big-mac"],
  });
  assert.deepEqual(result.menus.map((menu) => menu.id), ["mcdonald-big-mac"]);
  assert.deepEqual(result.unknownMenuIds, ["unknown-id", "starbucks-caffe-americano-hot"]);
  assert.equal(result.menus[0].optionGroups[0].id, "mcdonald-serving");
});

test("rejects unknown stores, categories, unsafe IDs, and missing menu details", async () => {
  const service = createService();
  await assert.rejects(service.listMenus({ storeId: "unknown" }), (error: unknown) => error instanceof CatalogError && error.code === "STORE_NOT_FOUND");
  await assert.rejects(service.listMenus({ storeId: "mcdonald", categoryId: "coffee" }), /없는 카테고리/);
  await assert.rejects(service.getMenu("bad id"), (error: unknown) => error instanceof CatalogError && error.code === "VALIDATION_ERROR");
  await assert.rejects(service.getMenu("mcdonald-missing"), (error: unknown) => error instanceof CatalogError && error.code === "MENU_NOT_FOUND");
});
