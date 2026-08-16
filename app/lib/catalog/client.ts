import type {
  CatalogMenuDetail,
  CatalogMenuSummary,
  Category,
  Store,
  StoreKey,
} from "../../../shared/catalog/types.ts";

export type StoreCatalog = Store & { categories: readonly Category[] };

export type CatalogBundle = {
  catalogVersion: string;
  stores: readonly StoreCatalog[];
  menusByStore: Readonly<Record<StoreKey, readonly CatalogMenuSummary[]>>;
};

type ApiEnvelope<T> = { data: T };

async function requestData<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      accept: "application/json",
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const payload = await response.json() as ApiEnvelope<T> | { error?: { message?: string } };
  if (!response.ok || !("data" in payload)) {
    throw new Error("error" in payload && payload.error?.message
      ? payload.error.message
      : "메뉴를 불러오지 못했습니다.");
  }
  return payload.data;
}

export async function loadCatalog(): Promise<CatalogBundle> {
  const storeResult = await requestData<{ stores: StoreCatalog[]; catalogVersion: string }>("/api/catalog/stores");
  const menuEntries = await Promise.all(storeResult.stores.map(async (store) => {
    const menus: CatalogMenuSummary[] = [];
    let cursor: string | null = null;
    do {
      const search = new URLSearchParams({ limit: "200" });
      if (cursor) search.set("cursor", cursor);
      const page = await requestData<{
        menus: CatalogMenuSummary[];
        nextCursor: string | null;
      }>(`/api/catalog/stores/${store.id}/menus?${search}`);
      menus.push(...page.menus);
      cursor = page.nextCursor;
    } while (cursor);
    return [store.id, menus] as const;
  }));
  return {
    stores: storeResult.stores,
    catalogVersion: storeResult.catalogVersion,
    menusByStore: Object.fromEntries(menuEntries) as Record<StoreKey, CatalogMenuSummary[]>,
  };
}

export async function resolveCatalogMenus(storeId: StoreKey, menuIds: readonly string[]) {
  return requestData<{
    store: Store;
    menus: CatalogMenuDetail[];
    unknownMenuIds: string[];
    catalogVersion: string;
  }>("/api/catalog/resolve", {
    method: "POST",
    body: JSON.stringify({ storeId, menuIds }),
  });
}
