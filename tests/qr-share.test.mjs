import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_QR_PAYLOAD_LENGTH,
  copyShareText,
  countQrMenus,
  countQrStores,
  createQrShareUrl,
  getStorePayload,
  parseQrPayload,
  readSharedQrPayload,
  serializeQrPayload,
} from "../app/lib/qr-share.ts";

test("parses and serializes single and multi-store QR payloads", () => {
  const payload = "mcdonald={101,201};subway={italian-bmt-15}";
  const groups = parseQrPayload(payload);

  assert.deepEqual(groups, [
    { store: "mcdonald", menuIds: ["101", "201"] },
    { store: "subway", menuIds: ["italian-bmt-15"] },
  ]);
  assert.equal(serializeQrPayload(groups), payload);
  assert.equal(countQrMenus(payload), 3);
  assert.equal(countQrStores(payload), 2);
});

test("extracts only the requested store group", () => {
  const payload = "mcdonald={101,201};subway={11,12}";

  assert.equal(getStorePayload(payload, "mcdonald"), "mcdonald={101,201}");
  assert.equal(getStorePayload(payload, "subway"), "subway={11,12}");
  assert.equal(getStorePayload(payload, "starbucks"), null);
  assert.equal(getStorePayload(payload, "bad store"), null);
});

test("rejects malformed, duplicate, unsafe, and oversized payloads", () => {
  const oversized = `mcdonald={${"1".repeat(MAX_QR_PAYLOAD_LENGTH)}}`;

  for (const payload of [
    "",
    "mcdonald={101, 201}",
    "mcdonald={101,,201}",
    "mcdonald={101};mcdonald={201}",
    "mcdonald={101,101}",
    "mcdonald={<script>}",
    "mcdonald=101",
    oversized,
  ]) {
    assert.equal(parseQrPayload(payload), null, payload);
  }
});

test("creates an encoded root share URL and reads it back", () => {
  const payload = "mcdonald={101,201};subway={11}";
  const shareUrl = createQrShareUrl("https://prepped.example/app", payload);
  const parsedUrl = new URL(shareUrl);

  assert.equal(parsedUrl.pathname, "/");
  assert.equal(parsedUrl.searchParams.get("qr"), payload);
  assert.match(shareUrl, /qr=mcdonald%3D%7B101%2C201%7D%3Bsubway%3D%7B11%7D/);
  assert.deepEqual(readSharedQrPayload(parsedUrl.search), { payload, error: null });
  assert.deepEqual(readSharedQrPayload(""), { payload: null, error: null });
  assert.deepEqual(readSharedQrPayload("?qr=not-a-payload"), { payload: null, error: "invalid" });
  assert.deepEqual(readSharedQrPayload("?qr=menu%3D%7B%7D&qr=mcdonald%3D%7B101%7D"), {
    payload: null,
    error: "invalid",
  });
});

test("uses clipboard first and falls back when permission is denied", async () => {
  const copied = [];
  const clipboardResult = await copyShareText("first", {
    writeClipboard: async (text) => copied.push(`clipboard:${text}`),
    fallbackCopy: () => false,
  });
  const fallbackResult = await copyShareText("second", {
    writeClipboard: async () => {
      throw new Error("denied");
    },
    fallbackCopy: (text) => {
      copied.push(`fallback:${text}`);
      return true;
    },
  });

  assert.equal(clipboardResult, "clipboard");
  assert.equal(fallbackResult, "fallback");
  assert.deepEqual(copied, ["clipboard:first", "fallback:second"]);
  await assert.rejects(
    copyShareText("third", { fallbackCopy: () => false }),
    /Copy failed/,
  );
});
