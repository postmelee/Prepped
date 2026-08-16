import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

const MCDONALD_BASE = "https://www.mcdonalds.co.kr";
const SUBWAY_BASE = "https://www.subway.co.kr";
const STARBUCKS_BASE = "https://www.starbucks.co.kr";

export const MCDONALD_CATEGORIES = [
  ["burger", 1],
  ["side-dessert", 4],
  ["breakfast", 2],
  ["happy-meal", 3],
  ["beverage", 5],
];

export const SUBWAY_CATEGORIES = ["sandwich", "grain_salad", "salad", "unit", "morning", "sidedrink"];

export const STARBUCKS_CATEGORIES = [
  ["drink-cold-brew", "W0000171", "drink"],
  ["drink-brewed", "W0000060", "drink"],
  ["drink-espresso", "W0000003", "drink"],
  ["drink-frappuccino", "W0000004", "drink"],
  ["drink-blended", "W0000005", "drink"],
  ["drink-refresher", "W0000422", "drink"],
  ["drink-fizzio", "W0000061", "drink"],
  ["drink-tea", "W0000075", "drink"],
  ["drink-etc", "W0000053", "drink"],
  ["drink-juice", "W0000062", "drink"],
  ["food-bakery", "W0000013", "food"],
  ["food-cake", "W0000032", "food"],
  ["food-sandwich", "W0000033", "food"],
  ["food-hot-food", "W0000054", "food"],
  ["food-fruit-yogurt", "W0000055", "food"],
  ["food-snack", "W0000056", "food"],
  ["food-icecream", "W0000064", "food"],
];

function decodeHtml(value) {
  const entities = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
  return value
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (_, entity) => {
      if (entity[0] === "#") {
        const radix = entity[1]?.toLowerCase() === "x" ? 16 : 10;
        const digits = radix === 16 ? entity.slice(2) : entity.slice(1);
        return String.fromCodePoint(Number.parseInt(digits, radix));
      }
      return entities[entity.toLowerCase()] ?? `&${entity};`;
    })
    .replace(/\s+/g, " ")
    .trim();
}

function attribute(block, name) {
  return block.match(new RegExp(`(?:^|\\s)${name}=["']([^"']*)["']`, "i"))?.[1] ?? "";
}

function textByClass(block, tag, className) {
  return decodeHtml(block.match(new RegExp(`<${tag}[^>]*class=["'][^"']*${className}[^"']*["'][^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1] ?? "");
}

export function parseSubwayMenuHtml(html, categoryId) {
  return html
    .split(/<li(?=\s+data-menusubsort=)/i)
    .slice(1)
    .map((block) => {
      const link = block.match(/<a[^>]*data-menuitemidx=["'][^"']+["'][^>]*>/i)?.[0] ?? "";
      const image = [...block.matchAll(/<img[^>]*>/gi)].map((match) => match[0]).find((tag) => /src=["']\/upload\/menu\//i.test(tag)) ?? "";
      return {
        sourceId: attribute(link, "data-menuitemidx"),
        categoryId,
        className: attribute(`<li ${block.slice(0, block.indexOf(">"))}>`, "class"),
        name: textByClass(block, "strong", "tit"),
        imageUrl: new URL(decodeHtml(attribute(image, "src")) || "/images/common/noneImage.jpg", SUBWAY_BASE).href,
      };
    })
    .filter((item) => item.sourceId && item.name);
}

async function fetchChecked(url, type = "json") {
  const parsed = new URL(url);
  const allowedHosts = new Set(["www.mcdonalds.co.kr", "www.subway.co.kr", "www.starbucks.co.kr"]);
  if (parsed.protocol !== "https:" || !allowedHosts.has(parsed.hostname)) throw new Error(`Blocked catalog host: ${parsed.hostname}`);
  const response = await fetch(parsed, {
    redirect: "follow",
    headers: { "user-agent": "PreppedCatalogCollector/0.1 (+https://github.com/postmelee/Prepped)" },
  });
  if (!response.ok) throw new Error(`${parsed.hostname} returned ${response.status}`);
  const finalUrl = new URL(response.url);
  if (!allowedHosts.has(finalUrl.hostname)) throw new Error(`Blocked redirect host: ${finalUrl.hostname}`);
  return type === "text" ? response.text() : response.json();
}

export async function collectMcDonalds() {
  const pages = await Promise.all(MCDONALD_CATEGORIES.map(async ([categoryId, categorySeq]) => {
    const url = new URL("/api/v1/kor/product/product/list", MCDONALD_BASE);
    url.search = new URLSearchParams({ page: "1", view_rows: "200", mainCategory: String(categorySeq), searchWord: "" }).toString();
    const payload = await fetchChecked(url);
    return (payload.resultObject?.list ?? []).map((item) => ({
      sourceId: String(item.seq),
      categoryId,
      name: decodeHtml(item.korName ?? ""),
      imageUrl: new URL(item.pcImageUrl || item.pcListImageUrl || "/", MCDONALD_BASE).href,
      menuStatus: item.menuStatus ?? "",
    }));
  }));
  const bySourceId = new Map();
  pages.flat().forEach((item) => {
    if (!bySourceId.has(item.sourceId)) bySourceId.set(item.sourceId, item);
  });
  return [...bySourceId.values()];
}

export async function collectSubway() {
  const pages = await Promise.all(SUBWAY_CATEGORIES.map(async (categoryId) => {
    const html = await fetchChecked(`${SUBWAY_BASE}/menuList/${categoryId}`, "text");
    return parseSubwayMenuHtml(html, categoryId.replaceAll("_", "-"));
  }));
  return pages.flat();
}

export async function collectStarbucks() {
  const pages = await Promise.all(STARBUCKS_CATEGORIES.map(async ([categoryId, code, kind]) => {
    const payload = await fetchChecked(`${STARBUCKS_BASE}/upload/json/menu/${code}.js`);
    return (payload.list ?? [])
      .filter((item) => item.sold_OUT !== "Y")
      .map((item) => ({
        sourceId: String(item.product_CD),
        categoryId,
        kind,
        name: decodeHtml(item.product_NM ?? ""),
        imageUrl: new URL(item.file_PATH, String(item.img_UPLOAD_PATH || STARBUCKS_BASE).replace("www.", "image.")).href,
      }));
  }));
  return pages.flat();
}

export function verifyCollectorFixtures() {
  const subway = parseSubwayMenuHtml(`
    <li data-menusubsort="1" data-menumainsort="1" class="ITEM_SANDWICH.CLASSIC">
      <div class="img"><img src="/upload/menu/egg.png" alt="에그마요"></div>
      <strong class="tit">에그마요</strong>
      <a data-category="sandwich" data-menuitemidx="1530"></a>
    </li>
  `, "sandwich");
  assert.deepEqual(subway, [{
    sourceId: "1530",
    categoryId: "sandwich",
    className: "ITEM_SANDWICH.CLASSIC",
    name: "에그마요",
    imageUrl: "https://www.subway.co.kr/upload/menu/egg.png",
  }]);
}

export function verifyLiveCounts(data) {
  assert.ok(data.mcdonald.length >= 80, `McDonald's item count dropped to ${data.mcdonald.length}`);
  assert.ok(data.subway.length >= 80, `Subway item count dropped to ${data.subway.length}`);
  assert.ok(data.starbucks.length >= 250, `Starbucks item count dropped to ${data.starbucks.length}`);
}

export async function collectAll() {
  const [mcdonald, subway, starbucks] = await Promise.all([
    collectMcDonalds(),
    collectSubway(),
    collectStarbucks(),
  ]);
  const data = { mcdonald, subway, starbucks };
  verifyLiveCounts(data);
  return data;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has("--fixtures")) verifyCollectorFixtures();
  if (args.has("--live")) {
    const data = await collectAll();
    if (args.has("--json")) process.stdout.write(JSON.stringify(data));
    else process.stdout.write(`${JSON.stringify(Object.fromEntries(Object.entries(data).map(([key, items]) => [key, items.length])))}\n`);
  }
  if (args.has("--check")) {
    const { CATALOG_SNAPSHOT } = await import("../../shared/catalog/data/index.ts");
    const counts = Object.fromEntries(CATALOG_SNAPSHOT.stores.map((store) => [
      store.id,
      CATALOG_SNAPSHOT.menus.filter((menu) => menu.storeId === store.id).length,
    ]));
    assert.equal(CATALOG_SNAPSHOT.stores.length, 3);
    assert.ok(counts.mcdonald >= 80);
    assert.ok(counts.subway >= 80);
    assert.ok(counts.starbucks >= 250);
    process.stdout.write(`catalog snapshot verified ${JSON.stringify(counts)}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
