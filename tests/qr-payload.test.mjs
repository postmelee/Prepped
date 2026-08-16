import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_MENU_IDS_PER_STORE,
  parseQrPayload,
  selectStoreMenuIds,
  serializeQrPayload,
} from "../shared/qr/payload.ts";

test("serializes enabled stores in a deterministic order", () => {
  assert.equal(
    serializeQrPayload({
      starbucks: ["starbucks-caffe-americano-hot"],
      mcdonald: ["mcdonald-big-mac", "mcdonald-fries"],
      subway: ["subway-egg-mayo-15cm"],
    }),
    "mcdonald={mcdonald-big-mac,mcdonald-fries};subway={subway-egg-mayo-15cm};starbucks={starbucks-caffe-americano-hot}",
  );

  assert.equal(
    serializeQrPayload(
      { mcdonald: ["mcdonald-big-mac"], subway: ["subway-egg-mayo-15cm"] },
      ["subway"],
    ),
    "subway={subway-egg-mayo-15cm}",
  );
  assert.equal(serializeQrPayload({}), "menu={}");
});

test("parses multiple stores, merges duplicate groups, and preserves raw input", () => {
  const raw = "mcdonald={101, 201};subway={subway-egg-mayo-15cm};mcdonald={201,301}";
  const parsed = parseQrPayload(raw);

  assert.equal(parsed.raw, raw);
  assert.deepEqual(parsed.groups, [
    { storeKey: "mcdonald", menuIds: ["101", "201", "301"] },
    { storeKey: "subway", menuIds: ["subway-egg-mayo-15cm"] },
  ]);
  assert.deepEqual(selectStoreMenuIds(raw, "subway"), ["subway-egg-mayo-15cm"]);
  assert.deepEqual(selectStoreMenuIds(raw, "starbucks"), []);
});

test("rejects unsafe tokens without discarding valid menu IDs", () => {
  const parsed = parseQrPayload("mcdonald={mcdonald-big-mac,bad id,ok_id,../bad}");
  assert.deepEqual(parsed.groups[0].menuIds, ["mcdonald-big-mac", "ok_id"]);
  assert.deepEqual(parsed.rejectedTokens, ["bad id", "../bad"]);
  assert.throws(() => serializeQrPayload({ mcdonald: ["bad id"] }), /Invalid QR menu ID/);
});

test("enforces the menu count boundary", () => {
  const menuIds = Array.from({ length: MAX_MENU_IDS_PER_STORE + 1 }, (_, index) => `menu-${index}`);
  assert.throws(() => serializeQrPayload({ mcdonald: menuIds }), /more than/);
});
