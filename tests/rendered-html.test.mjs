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
  assert.match(html, /내 한끼 QR 복사/);
  assert.match(html, /내 한끼 QR 링크 복사/);
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
  assert.match(html, /이 키오스크의/);
  assert.match(html, /매장을 골라주세요/);
  assert.match(html, /맥도날드/);
  assert.match(html, /써브웨이/);
  assert.match(html, /스타벅스/);
  assert.doesNotMatch(html, /한끼패스|Your site is taking shape/);
});

test("keeps the PWA and QR contracts explicit", async () => {
  const [
    manifestSource,
    mobileSource,
    storageSource,
    catalogSource,
    settingsSource,
    kioskSource,
    kioskResolveSource,
    kioskSelectorSource,
    kioskResultSource,
    shareSource,
    stylesSource,
  ] = await Promise.all([
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/catalog/storage.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/menu-catalog.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/store-settings.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/kiosk/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/catalog/resolve.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/kiosk-store-selector.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/kiosk-menu-result.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/qr-share.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
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
  assert.match(mobileSource, /const qrPayload = sharedPayload \?\? localQrPayload/);
  assert.match(mobileSource, /내 한끼 QR 복사/);
  assert.match(mobileSource, /공유 링크가 복사되었습니다\./);
  assert.match(mobileSource, /className=\{`share-confirmation/);
  assert.match(mobileSource, /aria-atomic="true"/);
  assert.match(mobileSource, /shareNoticeTimerRef/);
  assert.match(mobileSource, /shareButtonFeedback/);
  assert.doesNotMatch(mobileSource, /전체 링크 복사|모든 매장의 메뉴 QR 링크 복사/);
  assert.match(mobileSource, /\$\{store\.name\} 메뉴 QR 링크 복사/);
  assert.match(mobileSource, /공유받은 QR이에요/);
  assert.match(mobileSource, /내 설정 메뉴는 바뀌지 않아요/);
  assert.match(mobileSource, /function returnToLocalQr\(\)[\s\S]*?searchParams\.delete\("qr"\)/);
  assert.doesNotMatch(mobileSource, /role="switch"/);
  assert.match(mobileSource, /type AppTab = "qr" \| "create" \| "settings"/);
  assert.match(mobileSource, /<h1>내 설정 메뉴<\/h1>/);
  assert.match(settingsSource, /QR 사용 중/);
  assert.match(settingsSource, /설정 없음/);
  assert.match(settingsSource, /className=\{`qr-status status-button/);
  assert.match(settingsSource, /onClick=\{\(\) => onToggle\(store\.id\)\}/);
  assert.match(catalogSource, /예상 가격/);
  assert.match(catalogSource, /공식 확인 가격/);
  assert.match(catalogSource, /onError=\{\(\) => setFailed\(true\)\}/);
  assert.match(mobileSource, /aria-current=\{tab === "settings" \? "page" : undefined\}/);
  assert.match(mobileSource, /function startCreate\(\)[\s\S]*?setStep\("store"\)/);
  assert.match(mobileSource, /function editSavedStore\(\s*storeId: StoreKey[\s\S]*?chooseStore\(storeId, true\)/);
  assert.match(mobileSource, /function requestTabChange\(nextTab: SavedViewTab\)[\s\S]*?setPendingLeaveTarget\(nextTab\)/);
  assert.match(mobileSource, /변경한 메뉴를 저장할까요\?/);
  assert.match(mobileSource, /저장하지 않으면 기존 메뉴가 그대로 유지돼요/);
  assert.match(mobileSource, /onClick=\{discardDraftAndLeave\} autoFocus/);
  assert.match(mobileSource, /resolveCatalogMenus\(activeStoreId, selectedIds\)/);
  assert.match(mobileSource, /QR에는 메뉴 ID만 저장돼요/);
  assert.match(mobileSource, /커스텀 항목의 선택값은 저장되지 않아요/);
  assert.match(kioskResolveSource, /selectStoreMenuIds\(raw, storeId\)/);
  assert.match(kioskResolveSource, /resolveCatalogMenus\(storeId, requestedMenuIds\)/);
  assert.match(kioskSelectorSource, /맥도날드/);
  assert.match(kioskSelectorSource, /써브웨이/);
  assert.match(kioskSelectorSource, /스타벅스/);
  assert.match(kioskResultSource, /unknownMenuIds/);
  assert.match(kioskResultSource, /optionGroups/);
  assert.match(shareSource, /MAX_QR_PAYLOAD_LENGTH = 1_500/);
  assert.match(shareSource, /new URL\("\/", origin\)/);
  assert.match(shareSource, /url\.searchParams\.set\("qr", payload\)/);
  assert.match(shareSource, /params\.getAll\("qr"\)\.length !== 1/);
  assert.match(shareSource, /environment\.fallbackCopy\(text\)/);
  assert.match(
    stylesSource,
    /\.bottom-nav\s*\{[^}]*position:\s*fixed;[^}]*left:\s*50%;[^}]*width:\s*min\(100%, 480px\);[^}]*transform:\s*translateX\(-50%\);/s,
  );
  assert.match(
    stylesSource,
    /\.sheet-backdrop\s*\{[^}]*position:\s*fixed;[^}]*left:\s*50%;[^}]*width:\s*min\(100%, 480px\);[^}]*transform:\s*translateX\(-50%\);/s,
  );
  assert.match(
    stylesSource,
    /\.bottom-sheet\s*\{[^}]*max-height:\s*min\(88dvh, 100%\);[^}]*overscroll-behavior:\s*contain;/s,
  );
  assert.match(
    stylesSource,
    /\.store-toggle\s*>\s*\.store-share-button\s*\{[^}]*grid-column:\s*3;[^}]*grid-row:\s*1;[^}]*justify-self:\s*end;/s,
  );
  assert.match(
    stylesSource,
    /\.share-confirmation\s*\{[^}]*position:\s*fixed;[^}]*top:\s*50%;[^}]*left:\s*50%;[^}]*width:\s*min\(calc\(100% - 48px\), 360px\);/s,
  );
  assert.match(stylesSource, /\.share-button-feedback\s*\{[^}]*share-button-confirm 360ms/s);
  assert.match(stylesSource, /@keyframes share-confirmation-in/);
  assert.match(
    stylesSource,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.share-confirmation[\s\S]*?animation:\s*none !important;/,
  );
  assert.match(kioskSource, /navigator\.mediaDevices\.getUserMedia/);
  assert.match(kioskSource, /QR 문자열을 직접 입력할 수도 있어요/);
  assert.match(kioskSource, /다중 매장 샘플 QR로 미리 보기/);
  assert.match(kioskSource, /결제하기/);
});
