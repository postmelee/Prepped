import { QR_SAFE_ID } from "../../../shared/catalog/schema.ts";
import { STORE_KEYS, type StoreKey } from "../../../shared/catalog/types.ts";

export const MENU_SETTINGS_STORAGE_KEY = "prepped-menu-settings-v2";
export const LEGACY_MENU_STORAGE_KEY = "onemeal-menu-v1";

export type StoreMenuSetting = {
  enabled: boolean;
  menuIds: string[];
};

export type MenuSettings = {
  version: 2;
  stores: Record<StoreKey, StoreMenuSetting>;
};

export type StorageReader = Pick<Storage, "getItem">;
export type StorageWriter = Pick<Storage, "setItem">;

const LEGACY_ID_MAP: Readonly<Record<number, string>> = {
  101: "mcdonald-178",
  102: "mcdonald-181",
  103: "mcdonald-2",
  104: "mcdonald-603",
  201: "mcdonald-720",
  202: "mcdonald-722",
  203: "mcdonald-126",
  302: "mcdonald-28",
};

export function migrateLegacyMenuId(menuId: string): string {
  if (!/^\d+$/.test(menuId)) return menuId;
  return LEGACY_ID_MAP[Number(menuId)] ?? menuId;
}

export const LEGACY_MENU_LABELS: Readonly<Record<string, { name: string; price: number }>> = {
  "301": { name: "코카콜라 (이전 설정)", price: 2600 },
  "303": { name: "바닐라 쉐이크 (이전 설정)", price: 3500 },
};

function emptyStores(): Record<StoreKey, StoreMenuSetting> {
  return {
    mcdonald: { enabled: false, menuIds: [] },
    subway: { enabled: false, menuIds: [] },
    starbucks: { enabled: false, menuIds: [] },
  };
}

export function createDefaultMenuSettings(): MenuSettings {
  return {
    version: 2,
    stores: {
      ...emptyStores(),
      mcdonald: {
        enabled: true,
        menuIds: ["mcdonald-178", "mcdonald-720", "mcdonald-28"],
      },
    },
  };
}

function uniqueSafeMenuIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((menuId): menuId is string =>
    typeof menuId === "string" && QR_SAFE_ID.test(menuId)))].slice(0, 20);
}

function parseCurrent(raw: string): MenuSettings | undefined {
  const value = JSON.parse(raw) as unknown;
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  if (record.version !== 2 || !record.stores || typeof record.stores !== "object" || Array.isArray(record.stores)) {
    return undefined;
  }
  const stores = emptyStores();
  STORE_KEYS.forEach((storeId) => {
    const candidate = (record.stores as Record<string, unknown>)[storeId];
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return;
    const setting = candidate as Record<string, unknown>;
    const menuIds = uniqueSafeMenuIds(setting.menuIds);
    stores[storeId] = { enabled: setting.enabled === true && menuIds.length > 0, menuIds };
  });
  return { version: 2, stores };
}

function migrateLegacy(raw: string): MenuSettings | undefined {
  const value = JSON.parse(raw) as unknown;
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.savedIds)) return undefined;
  const menuIds = [...new Set(record.savedIds.flatMap((legacyId) => {
    if (!Number.isInteger(legacyId)) return [];
    return [migrateLegacyMenuId(String(legacyId))];
  }))].slice(0, 20);
  const stores = emptyStores();
  stores.mcdonald = {
    enabled: record.storeEnabled !== false && menuIds.length > 0,
    menuIds,
  };
  return { version: 2, stores };
}

export function readMenuSettings(storage: StorageReader): MenuSettings {
  try {
    const current = storage.getItem(MENU_SETTINGS_STORAGE_KEY);
    if (current) return parseCurrent(current) ?? createDefaultMenuSettings();
    const legacy = storage.getItem(LEGACY_MENU_STORAGE_KEY);
    if (legacy) return migrateLegacy(legacy) ?? createDefaultMenuSettings();
  } catch {
    // Fall through to a deterministic on-device default.
  }
  return createDefaultMenuSettings();
}

export function writeMenuSettings(storage: StorageWriter, settings: MenuSettings) {
  storage.setItem(MENU_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function updateStoreSetting(
  settings: MenuSettings,
  storeId: StoreKey,
  setting: StoreMenuSetting,
): MenuSettings {
  return {
    version: 2,
    stores: {
      ...settings.stores,
      [storeId]: {
        enabled: setting.enabled && setting.menuIds.length > 0,
        menuIds: uniqueSafeMenuIds(setting.menuIds),
      },
    },
  };
}
