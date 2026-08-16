import assert from "node:assert/strict";
import test from "node:test";

import { menuIdsForSelectedStore, resolveQrForStore } from "../app/lib/catalog/resolve.ts";
import { handleLocalCatalogRequest } from "../shared/catalog/local-api.ts";

const MULTI_STORE_QR = "mcdonald={mcdonald-178,mcdonald-720};subway={subway-1530-15cm,subway-1530-15cm};starbucks={starbucks-94}";

test("extracts only the selected kiosk store and removes duplicate IDs", () => {
  assert.deepEqual(menuIdsForSelectedStore(MULTI_STORE_QR, "mcdonald"), ["mcdonald-178", "mcdonald-720"]);
  assert.deepEqual(menuIdsForSelectedStore(MULTI_STORE_QR, "subway"), ["subway-1530-15cm"]);
  assert.deepEqual(menuIdsForSelectedStore(MULTI_STORE_QR, "starbucks"), ["starbucks-94"]);
});

test("maps supported legacy numeric McDonald's IDs before catalog lookup", () => {
  assert.deepEqual(menuIdsForSelectedStore("mcdonald={101,201,301}", "mcdonald"), [
    "mcdonald-178",
    "mcdonald-720",
    "301",
  ]);
});

test("rejects malformed QR and a QR without the selected store group", () => {
  assert.throws(() => menuIdsForSelectedStore("not-a-menu", "subway"), (error) => error.code === "INVALID_QR");
  assert.throws(() => menuIdsForSelectedStore("mcdonald={mcdonald-178}", "starbucks"), (error) => error.code === "STORE_GROUP_MISSING");
});

test("resolves only selected-store catalog menus and keeps partial unknown IDs", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (input, init) => {
    const path = typeof input === "string" ? input : input.url;
    return handleLocalCatalogRequest(new Request(new URL(path, "https://prepped.test"), init));
  };
  try {
    const result = await resolveQrForStore(
      "mcdonald={mcdonald-178};subway={subway-1530-15cm,missing-menu};starbucks={starbucks-94}",
      "subway",
    );
    assert.equal(result.store.id, "subway");
    assert.deepEqual(result.menus.map((menu) => menu.id), ["subway-1530-15cm"]);
    assert.deepEqual(result.unknownMenuIds, ["missing-menu"]);
    assert.ok(result.menus[0].optionGroups.some((group) => group.id === "subway-bread"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
