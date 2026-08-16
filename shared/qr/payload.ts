import { QR_SAFE_ID } from "../catalog/schema.ts";
import { STORE_KEYS, type StoreKey } from "../catalog/types.ts";

export const QR_GROUP_PATTERN = /([A-Za-z0-9_-]+)=\{([^}]*)\}/g;
export const MAX_MENU_IDS_PER_STORE = 20;
export const MAX_QR_PAYLOAD_LENGTH = 1200;

export type QrStoreGroup = {
  storeKey: string;
  menuIds: string[];
};

export type QrParseResult = {
  raw: string;
  groups: QrStoreGroup[];
  rejectedTokens: string[];
};

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

export function parseQrPayload(raw: string): QrParseResult {
  const groups = new Map<string, string[]>();
  const rejectedTokens: string[] = [];

  for (const match of raw.matchAll(QR_GROUP_PATTERN)) {
    const storeKey = match[1];
    const accepted: string[] = [];
    for (const token of match[2].split(",").map((value) => value.trim()).filter(Boolean)) {
      if (QR_SAFE_ID.test(token)) accepted.push(token);
      else rejectedTokens.push(token);
    }
    groups.set(storeKey, unique([...(groups.get(storeKey) ?? []), ...accepted]));
  }

  return {
    raw,
    groups: [...groups].map(([storeKey, menuIds]) => ({ storeKey, menuIds })),
    rejectedTokens,
  };
}

export function selectStoreMenuIds(raw: string, storeKey: StoreKey): string[] {
  return parseQrPayload(raw).groups.find((group) => group.storeKey === storeKey)?.menuIds ?? [];
}

export function serializeQrPayload(
  selections: Partial<Record<StoreKey, readonly string[]>>,
  enabledStores: readonly StoreKey[] = STORE_KEYS,
): string {
  const enabled = new Set(enabledStores);
  const groups = STORE_KEYS.flatMap((storeKey) => {
    if (!enabled.has(storeKey)) return [];
    const menuIds = unique(selections[storeKey] ?? []);
    if (menuIds.length === 0) return [];
    if (menuIds.length > MAX_MENU_IDS_PER_STORE) {
      throw new RangeError(`${storeKey} has more than ${MAX_MENU_IDS_PER_STORE} menu IDs`);
    }
    for (const menuId of menuIds) {
      if (!QR_SAFE_ID.test(menuId)) throw new TypeError(`Invalid QR menu ID: ${menuId}`);
    }
    return [`${storeKey}={${menuIds.join(",")}}`];
  });

  const payload = groups.join(";") || "menu={}";
  if (payload.length > MAX_QR_PAYLOAD_LENGTH) {
    throw new RangeError(`QR payload exceeds ${MAX_QR_PAYLOAD_LENGTH} characters`);
  }
  return payload;
}
