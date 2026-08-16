import { CATALOG_MENU_DETAILS, CATALOG_SNAPSHOT } from "./data/index.ts";
import { QR_SAFE_ID } from "./schema.ts";
import { STORE_KEYS, type CatalogMenuDetail, type CatalogMenuSummary, type StoreKey } from "./types.ts";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;
const MAX_RESOLVE_IDS = 20;

class LocalCatalogError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "LocalCatalogError";
    this.code = code;
    this.status = status;
  }
}

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "cache-control": status === 200 ? "public, max-age=300" : "no-store",
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function isStoreKey(value: string): value is StoreKey {
  return STORE_KEYS.includes(value as StoreKey);
}

function requireStore(storeId: string) {
  if (!isStoreKey(storeId)) {
    throw new LocalCatalogError("STORE_NOT_FOUND", "지원하지 않는 매장입니다.", 404);
  }
  const store = CATALOG_SNAPSHOT.stores.find((candidate) => candidate.id === storeId);
  if (!store) throw new LocalCatalogError("STORE_NOT_FOUND", "매장을 찾을 수 없습니다.", 404);
  return store;
}

function requireMenuId(menuId: string) {
  if (!QR_SAFE_ID.test(menuId)) {
    throw new LocalCatalogError("VALIDATION_ERROR", "메뉴 ID 형식이 올바르지 않습니다.", 400);
  }
}

function parseLimit(value: string | null): number {
  if (value === null) return DEFAULT_LIMIT;
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new LocalCatalogError("VALIDATION_ERROR", `limit은 1 이상 ${MAX_LIMIT} 이하여야 합니다.`, 400);
  }
  return limit;
}

function parseCursor(value: string | null): number {
  if (value === null) return 0;
  if (!/^\d+$/.test(value)) {
    throw new LocalCatalogError("VALIDATION_ERROR", "cursor 형식이 올바르지 않습니다.", 400);
  }
  return Number.parseInt(value, 10);
}

function toSummary(menu: CatalogMenuDetail): CatalogMenuSummary {
  return {
    id: menu.id,
    storeId: menu.storeId,
    categoryId: menu.categoryId,
    name: menu.name,
    description: menu.description,
    variant: menu.variant,
    price: menu.price,
    source: menu.source,
    isAvailable: menu.isAvailable,
  };
}

function routeSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new LocalCatalogError("VALIDATION_ERROR", "경로 형식이 올바르지 않습니다.", 400);
  }
}

function listStores() {
  const stores = CATALOG_SNAPSHOT.stores
    .toSorted((left, right) => left.sortOrder - right.sortOrder)
    .map((store) => ({
      ...store,
      categories: CATALOG_SNAPSHOT.categories
        .filter((category) => category.storeId === store.id)
        .toSorted((left, right) => left.sortOrder - right.sortOrder),
    }));
  return { stores, catalogVersion: CATALOG_SNAPSHOT.version };
}

function listMenus(storeId: string, url: URL) {
  const store = requireStore(storeId);
  const categoryId = url.searchParams.get("category") ?? undefined;
  if (categoryId && !CATALOG_SNAPSHOT.categories.some((category) =>
    category.storeId === store.id && category.id === categoryId)) {
    throw new LocalCatalogError("VALIDATION_ERROR", "선택한 매장에 없는 카테고리입니다.", 400);
  }
  const limit = parseLimit(url.searchParams.get("limit"));
  const offset = parseCursor(url.searchParams.get("cursor"));
  const availableMenus = CATALOG_MENU_DETAILS
    .filter((menu) => menu.storeId === store.id && menu.isAvailable && (!categoryId || menu.categoryId === categoryId))
    .toSorted((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id));
  const menus = availableMenus.slice(offset, offset + limit);
  const nextOffset = offset + menus.length;
  return {
    store,
    menus: menus.map(toSummary),
    nextCursor: nextOffset < availableMenus.length ? String(nextOffset) : null,
    catalogVersion: CATALOG_SNAPSHOT.version,
  };
}

function getMenu(menuId: string) {
  requireMenuId(menuId);
  const menu = CATALOG_MENU_DETAILS.find((candidate) => candidate.id === menuId);
  if (!menu) throw new LocalCatalogError("MENU_NOT_FOUND", "메뉴를 찾을 수 없습니다.", 404);
  return { menu, catalogVersion: CATALOG_SNAPSHOT.version };
}

async function resolveMenus(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    throw new LocalCatalogError("VALIDATION_ERROR", "JSON 요청 형식이 올바르지 않습니다.", 400);
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new LocalCatalogError("VALIDATION_ERROR", "매장과 메뉴 ID를 다시 확인해주세요.", 400);
  }
  const value = input as Record<string, unknown>;
  if (typeof value.storeId !== "string" || !Array.isArray(value.menuIds) ||
      !value.menuIds.every((menuId) => typeof menuId === "string") || value.menuIds.length > MAX_RESOLVE_IDS) {
    throw new LocalCatalogError("VALIDATION_ERROR", `메뉴 ID는 문자열 ${MAX_RESOLVE_IDS}개 이하로 보내주세요.`, 400);
  }
  const store = requireStore(value.storeId);
  const menuIds = [...new Set(value.menuIds as string[])];
  menuIds.forEach(requireMenuId);
  const byId = new Map(CATALOG_MENU_DETAILS.map((menu) => [menu.id, menu]));
  const menus: CatalogMenuDetail[] = [];
  const unknownMenuIds: string[] = [];
  menuIds.forEach((menuId) => {
    const menu = byId.get(menuId);
    if (!menu || menu.storeId !== store.id || !menu.isAvailable) unknownMenuIds.push(menuId);
    else menus.push(menu);
  });
  return { store, menus, unknownMenuIds, catalogVersion: CATALOG_SNAPSHOT.version };
}

function errorPayload(error: LocalCatalogError) {
  return {
    error: {
      code: error.code,
      message: error.message,
      retryable: false,
      requestId: "local-catalog",
    },
  };
}

export async function handleLocalCatalogRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  try {
    if (url.pathname === "/api/catalog/stores" && request.method === "GET") {
      return json(200, { data: listStores() });
    }
    const storeMenusMatch = url.pathname.match(/^\/api\/catalog\/stores\/([^/]+)\/menus$/);
    if (storeMenusMatch && request.method === "GET") {
      return json(200, { data: listMenus(routeSegment(storeMenusMatch[1]), url) });
    }
    const menuMatch = url.pathname.match(/^\/api\/catalog\/menus\/([^/]+)$/);
    if (menuMatch && request.method === "GET") {
      return json(200, { data: getMenu(routeSegment(menuMatch[1])) });
    }
    if (url.pathname === "/api/catalog/resolve" && request.method === "POST") {
      return json(200, { data: await resolveMenus(request) });
    }
    return json(404, errorPayload(new LocalCatalogError("NOT_FOUND", "요청한 카탈로그 경로가 없습니다.", 404)));
  } catch (error) {
    if (error instanceof LocalCatalogError) return json(error.status, errorPayload(error));
    return json(500, {
      error: {
        code: "INTERNAL_ERROR",
        message: "일시적인 오류가 발생했습니다. 다시 시도해주세요.",
        retryable: true,
        requestId: "local-catalog",
      },
    });
  }
}
