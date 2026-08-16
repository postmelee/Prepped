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
  assert.match(html, /mcdonald=\{101,201,301\}/);
  assert.match(html, /내 한끼 QR 복사/);
  assert.match(html, /내 한끼 QR 링크 복사/);
  assert.match(html, /맥도날드 메뉴 QR 링크 복사/);
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
  const [manifestSource, mobileSource, kioskSource, shareSource] = await Promise.all([
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/kiosk/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/qr-share.ts", import.meta.url), "utf8"),
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

  assert.match(mobileSource, /onemeal-menu-v1/);
  assert.match(mobileSource, /mcdonald=\{\$\{savedIds\.join\(","\)\}\}/);
  assert.match(mobileSource, /const qrPayload = sharedPayload \?\? localQrPayload/);
  assert.match(mobileSource, /내 한끼 QR 복사/);
  assert.doesNotMatch(mobileSource, /전체 링크 복사|모든 매장의 메뉴 QR 링크 복사/);
  assert.match(mobileSource, /맥도날드 메뉴 QR 링크 복사/);
  assert.match(mobileSource, /공유받은 QR이에요/);
  assert.match(mobileSource, /내 설정 메뉴는 바뀌지 않아요/);
  assert.match(mobileSource, /function returnToLocalQr\(\)[\s\S]*?searchParams\.delete\("qr"\)/);
  assert.doesNotMatch(mobileSource, /role="switch"|setStoreEnabled/);
  assert.match(mobileSource, /type AppTab = "qr" \| "create" \| "settings"/);
  assert.match(mobileSource, /<h1>내 설정 메뉴<\/h1>/);
  assert.match(mobileSource, /맥도날드에 저장한 메뉴/);
  assert.match(mobileSource, /QR 사용 중/);
  assert.match(mobileSource, /설정 없음/);
  assert.match(mobileSource, /aria-current=\{tab === "settings" \? "page" : undefined\}/);
  assert.match(mobileSource, /function startCreate\(\)[\s\S]*?setStep\("store"\)/);
  assert.match(mobileSource, /function editSavedStore\(\)[\s\S]*?setSelectedIds\(\[\]\)[\s\S]*?setStep\("category"\)/);
  assert.equal(mobileSource.match(/onClick=\{editSavedStore\}/g)?.length, 2);
  assert.match(mobileSource, /function requestTabChange\(nextTab: SavedViewTab\)[\s\S]*?setPendingLeaveTarget\(nextTab\)/);
  assert.match(mobileSource, /변경한 메뉴를 저장할까요\?/);
  assert.match(mobileSource, /저장하지 않으면 기존 메뉴가 그대로 유지돼요/);
  assert.match(mobileSource, /onClick=\{discardDraftAndLeave\} autoFocus/);
  assert.match(mobileSource, /disabled=\{selectedIds\.length === 0\}/);
  assert.match(shareSource, /MAX_QR_PAYLOAD_LENGTH = 1_500/);
  assert.match(shareSource, /new URL\("\/", origin\)/);
  assert.match(shareSource, /url\.searchParams\.set\("qr", payload\)/);
  assert.match(shareSource, /params\.getAll\("qr"\)\.length !== 1/);
  assert.match(shareSource, /environment\.fallbackCopy\(text\)/);
  assert.match(kioskSource, /\(\[a-zA-Z0-9_-\]\+\)=\\\{\(\[\^}]\*\)\\\}/);
  assert.match(kioskSource, /navigator\.mediaDevices\.getUserMedia/);
  assert.match(kioskSource, /결제하기/);
});
