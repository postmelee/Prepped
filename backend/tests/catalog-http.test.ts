import assert from "node:assert/strict";
import test from "node:test";

import { InMemoryCatalogRepository } from "../src/catalog/repository.ts";
import { CatalogService } from "../src/catalog/service.ts";
import { DraftService, InMemoryDraftRepository } from "../src/domain/drafts.ts";
import { createHttpHandlers } from "../src/http/handlers.ts";
import { catalogManifest, catalogMenus, catalogSnapshot } from "./catalog-test-data.ts";

function createHandlers() {
  const draftService = new DraftService({ repository: new InMemoryDraftRepository() });
  const catalogService = new CatalogService(new InMemoryCatalogRepository({
    manifest: catalogManifest,
    stores: catalogSnapshot.stores,
    categories: catalogSnapshot.categories,
    menus: catalogMenus,
  }));
  return createHttpHandlers(draftService, ["https://prepped.chatgpt.site"], catalogService);
}

function event(input: {
  body?: unknown;
  pathParameters?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
} = {}) {
  return {
    body: input.body === undefined ? null : JSON.stringify(input.body),
    pathParameters: input.pathParameters ?? {},
    queryStringParameters: input.queryStringParameters ?? {},
    headers: { origin: "https://prepped.chatgpt.site" },
    requestContext: { requestId: "catalog-request-1" },
  };
}

test("catalog handlers list stores, menus, and a detailed menu", async () => {
  const handlers = createHandlers();
  const stores = await handlers.listStores(event());
  const menus = await handlers.listMenus(event({
    pathParameters: { storeId: "mcdonald" },
    queryStringParameters: { category: "burger", limit: "20" },
  }));
  const menu = await handlers.getMenu(event({ pathParameters: { menuId: "mcdonald-big-mac" } }));

  assert.equal(stores.statusCode, 200);
  assert.equal(JSON.parse(stores.body).data.stores.length, 3);
  assert.equal(JSON.parse(menus.body).data.menus[0].id, "mcdonald-big-mac");
  assert.equal(JSON.parse(menu.body).data.menu.optionGroups[0].id, "mcdonald-serving");
  assert.equal(menu.headers["access-control-allow-origin"], "https://prepped.chatgpt.site");
});

test("resolve handler keeps partial success and request order", async () => {
  const response = await createHandlers().resolveMenus(event({
    body: {
      storeId: "mcdonald",
      menuIds: ["unknown-id", "mcdonald-big-mac", "starbucks-caffe-americano-hot"],
    },
  }));
  const payload = JSON.parse(response.body);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(payload.data.menus.map((menu: { id: string }) => menu.id), ["mcdonald-big-mac"]);
  assert.deepEqual(payload.data.unknownMenuIds, ["unknown-id", "starbucks-caffe-americano-hot"]);
});

test("catalog handlers return stable validation and not-found errors", async () => {
  const handlers = createHandlers();
  const badLimit = await handlers.listMenus(event({
    pathParameters: { storeId: "mcdonald" },
    queryStringParameters: { limit: "not-a-number" },
  }));
  const missingStore = await handlers.listMenus(event({ pathParameters: { storeId: "unknown" } }));
  const missingMenu = await handlers.getMenu(event({ pathParameters: { menuId: "mcdonald-missing" } }));

  assert.equal(badLimit.statusCode, 400);
  assert.equal(JSON.parse(badLimit.body).error.code, "VALIDATION_ERROR");
  assert.equal(missingStore.statusCode, 404);
  assert.equal(JSON.parse(missingStore.body).error.code, "STORE_NOT_FOUND");
  assert.equal(missingMenu.statusCode, 404);
  assert.equal(JSON.parse(missingMenu.body).error.code, "MENU_NOT_FOUND");
});
