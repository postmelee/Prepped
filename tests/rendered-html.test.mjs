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
  assert.match(html, /메뉴 만들기/);
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
  const [manifestSource, mobileSource, kioskSource] = await Promise.all([
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
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

  assert.match(mobileSource, /onemeal-menu-v1/);
  assert.match(mobileSource, /mcdonald=\{\$\{savedIds\.join\(","\)\}\}/);
  assert.match(kioskSource, /\(\[a-zA-Z0-9_-\]\+\)=\\\{\(\[\^}]\*\)\\\}/);
  assert.match(kioskSource, /navigator\.mediaDevices\.getUserMedia/);
  assert.match(kioskSource, /결제하기/);
});
