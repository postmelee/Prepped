import type { CatalogMenuDetail, Store, StoreKey } from "../../../shared/catalog/types.ts";
import { MAX_MENU_IDS_PER_STORE, parseQrPayload, selectStoreMenuIds } from "../../../shared/qr/payload.ts";
import { resolveCatalogMenus } from "./client.ts";
import { migrateLegacyMenuId } from "./storage.ts";

export type KioskCatalogResolution = {
  store: Store;
  requestedMenuIds: readonly string[];
  menus: readonly CatalogMenuDetail[];
  unknownMenuIds: readonly string[];
  rejectedTokens: readonly string[];
  catalogVersion: string;
};

export class KioskQrError extends Error {
  readonly code: "INVALID_QR" | "STORE_GROUP_MISSING" | "TOO_MANY_MENUS";

  constructor(code: KioskQrError["code"], message: string) {
    super(message);
    this.name = "KioskQrError";
    this.code = code;
  }
}

export function menuIdsForSelectedStore(raw: string, storeId: StoreKey): string[] {
  const parsed = parseQrPayload(raw.trim());
  if (parsed.groups.length === 0) {
    throw new KioskQrError("INVALID_QR", "메뉴 QR 형식을 확인할 수 없습니다.");
  }
  const selectedIds = selectStoreMenuIds(raw, storeId);
  if (selectedIds.length === 0) {
    throw new KioskQrError("STORE_GROUP_MISSING", "이 QR에는 선택한 매장의 메뉴가 없습니다.");
  }
  if (selectedIds.length > MAX_MENU_IDS_PER_STORE) {
    throw new KioskQrError("TOO_MANY_MENUS", `한 매장 메뉴는 ${MAX_MENU_IDS_PER_STORE}개까지 읽을 수 있습니다.`);
  }
  return [...new Set(selectedIds.map(migrateLegacyMenuId))];
}

export async function resolveQrForStore(raw: string, storeId: StoreKey): Promise<KioskCatalogResolution> {
  const requestedMenuIds = menuIdsForSelectedStore(raw, storeId);
  const parsed = parseQrPayload(raw);
  const result = await resolveCatalogMenus(storeId, requestedMenuIds);
  return {
    ...result,
    requestedMenuIds,
    rejectedTokens: parsed.rejectedTokens,
  };
}
