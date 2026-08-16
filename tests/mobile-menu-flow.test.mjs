import assert from "node:assert/strict";
import test from "node:test";

import { loadCatalog, resolveCatalogMenus } from "../app/lib/catalog/client.ts";
import {
  LEGACY_MENU_STORAGE_KEY,
  MENU_SETTINGS_STORAGE_KEY,
  createDefaultMenuSettings,
  readMenuSettings,
  updateStoreSetting,
  writeMenuSettings,
} from "../app/lib/catalog/storage.ts";
import { handleLocalCatalogRequest } from "../shared/catalog/local-api.ts";
import { serializeQrPayload } from "../shared/qr/payload.ts";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
    value(key) { return values.get(key); },
  };
}

test("creates an on-device v2 setting with QR-safe current McDonald's IDs", () => {
  const settings = createDefaultMenuSettings();
  assert.deepEqual(settings.stores.mcdonald.menuIds, ["mcdonald-178", "mcdonald-720", "mcdonald-28"]);
  assert.equal(settings.stores.mcdonald.enabled, true);
  assert.deepEqual(settings.stores.subway, { enabled: false, menuIds: [] });
});

test("migrates the legacy numeric setting without dropping unknown historical IDs", () => {
  const storage = memoryStorage({
    [LEGACY_MENU_STORAGE_KEY]: JSON.stringify({ savedIds: [101, 201, 301, 101], storeEnabled: true }),
  });
  const settings = readMenuSettings(storage);
  assert.deepEqual(settings.stores.mcdonald.menuIds, ["mcdonald-178", "mcdonald-720", "301"]);
  assert.equal(settings.stores.mcdonald.enabled, true);

  writeMenuSettings(storage, settings);
  assert.deepEqual(JSON.parse(storage.value(MENU_SETTINGS_STORAGE_KEY)), settings);
});

test("updates one store setting without changing the other stores", () => {
  const original = createDefaultMenuSettings();
  const updated = updateStoreSetting(original, "subway", {
    enabled: true,
    menuIds: ["subway-1530-15cm", "subway-1530-15cm", "bad id"],
  });
  assert.deepEqual(updated.stores.subway, { enabled: true, menuIds: ["subway-1530-15cm"] });
  assert.deepEqual(updated.stores.mcdonald, original.stores.mcdonald);
  assert.deepEqual(original.stores.subway, { enabled: false, menuIds: [] });
});

test("catalog client loads every same-origin page and resolves customization details", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (input, init) => {
    const path = typeof input === "string" ? input : input.url;
    return handleLocalCatalogRequest(new Request(new URL(path, "https://prepped.test"), init));
  };
  try {
    const catalog = await loadCatalog();
    assert.deepEqual(catalog.stores.map((store) => store.id), ["mcdonald", "subway", "starbucks"]);
    assert.deepEqual(Object.fromEntries(Object.entries(catalog.menusByStore).map(([key, menus]) => [key, menus.length])), {
      mcdonald: 91,
      subway: 93,
      starbucks: 311,
    });
    const resolved = await resolveCatalogMenus("subway", ["subway-1530-15cm", "starbucks-94"]);
    assert.equal(resolved.menus[0].id, "subway-1530-15cm");
    assert.ok(resolved.menus[0].optionGroups.some((group) => group.id === "subway-bread"));
    assert.deepEqual(resolved.unknownMenuIds, ["starbucks-94"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("serializes enabled store settings into one deterministic multi-store QR", () => {
  let settings = createDefaultMenuSettings();
  settings = updateStoreSetting(settings, "subway", { enabled: true, menuIds: ["subway-1530-15cm"] });
  settings = updateStoreSetting(settings, "starbucks", { enabled: true, menuIds: ["starbucks-94"] });
  assert.equal(
    serializeQrPayload(
      Object.fromEntries(Object.entries(settings.stores).map(([storeId, setting]) => [storeId, setting.menuIds])),
      ["mcdonald", "subway", "starbucks"],
    ),
    "mcdonald={mcdonald-178,mcdonald-720,mcdonald-28};subway={subway-1530-15cm};starbucks={starbucks-94}",
  );
});
