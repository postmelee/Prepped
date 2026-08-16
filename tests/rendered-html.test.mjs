import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${pathname}-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html", host: "localhost" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Prepped mobile QR route", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Prepped · 내 메뉴 QR<\/title>/i);
  assert.match(html, /Prepped 메뉴 QR 앱/);
  assert.match(html, /내 메뉴 QR/);
  assert.match(html, /mcdonald=\{mcdonald-178,mcdonald-720,mcdonald-28\}/);
  assert.match(html, /메뉴 만들기/);
  assert.match(html, /내 설정/);
  assert.match(html, /aria-current="page"/);
  assert.doesNotMatch(html, /한끼패스|Your site is taking shape|react-loading-skeleton/);
});

test("server-renders the Prepped kiosk route", async () => {
  const response = await render("/kiosk");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>키오스크 QR 스캐너 · Prepped<\/title>/i);
  assert.match(html, /휴대폰 QR을/);
  assert.match(html, /카메라 켜기/);
  assert.match(html, /샘플 QR로 미리 보기/);
  assert.doesNotMatch(html, /한끼패스|Your site is taking shape/);
});

test("keeps the PWA and QR contracts explicit", async () => {
  const [manifestSource, mobileSource, storageSource, catalogSource, settingsSource, kioskSource] = await Promise.all([
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/catalog/storage.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/menu-catalog.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/store-settings.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/kiosk/page.tsx", import.meta.url), "utf8"),
  ]);

  const manifest = JSON.parse(manifestSource);
  assert.equal(manifest.name, "Prepped · 내 메뉴 QR");
  assert.equal(manifest.short_name, "Prepped");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.scope, "/");
  assert.deepEqual(
    manifest.icons.map(({ src, sizes }) => ({ src, sizes })),
    [
      { src: "/icon-192.png", sizes: "192x192" },
      { src: "/icon-512.png", sizes: "512x512" },
    ],
  );

  assert.match(storageSource, /onemeal-menu-v1/);
  assert.match(storageSource, /prepped-menu-settings-v2/);
  assert.match(storageSource, /101: "mcdonald-178"/);
  assert.match(mobileSource, /serializeQrPayload/);
  assert.match(mobileSource, /type AppTab = "qr" \| "create" \| "settings"/);
  assert.match(mobileSource, /<h1>내 설정 메뉴<\/h1>/);
  assert.match(settingsSource, /QR 사용 중/);
  assert.match(settingsSource, /설정 없음/);
  assert.match(catalogSource, /예상 가격/);
  assert.match(catalogSource, /공식 확인 가격/);
  assert.match(catalogSource, /onError=\{\(\) => setFailed\(true\)\}/);
  assert.match(mobileSource, /aria-current=\{tab === "settings" \? "page" : undefined\}/);
  assert.match(mobileSource, /function startCreate\(\)[\s\S]*?setStep\("store"\)/);
  assert.match(mobileSource, /function editSavedStore\(storeId: StoreKey[\s\S]*?chooseStore\(storeId, true\)/);
  assert.match(mobileSource, /function requestTabChange\(nextTab: SavedViewTab\)[\s\S]*?setPendingLeaveTarget\(nextTab\)/);
  assert.match(mobileSource, /변경한 메뉴를 저장할까요\?/);
  assert.match(mobileSource, /저장하지 않으면 기존 메뉴가 그대로 유지돼요/);
  assert.match(mobileSource, /onClick=\{discardDraftAndLeave\} autoFocus/);
  assert.match(mobileSource, /resolveCatalogMenus\(activeStoreId, selectedIds\)/);
  assert.match(mobileSource, /QR에는 메뉴 ID와 기본 옵션이 저장돼요/);
  assert.match(kioskSource, /\(\[a-zA-Z0-9_-\]\+\)=\\\{\(\[\^}]\*\)\\\}/);
  assert.match(kioskSource, /navigator\.mediaDevices\.getUserMedia/);
  assert.match(kioskSource, /결제하기/);
});
