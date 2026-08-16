export const MAX_QR_PAYLOAD_LENGTH = 1_500;

const SAFE_TOKEN = /^[a-zA-Z0-9_-]+$/;
const PAYLOAD_GROUP = /^([a-zA-Z0-9_-]+)=\{([^{}]*)\}$/;

export type QrPayloadGroup = {
  store: string;
  menuIds: string[];
};

export type SharedPayloadResult = {
  payload: string | null;
  error: "invalid" | null;
};

export type CopyEnvironment = {
  writeClipboard?: (text: string) => Promise<void>;
  fallbackCopy: (text: string) => boolean;
};

export function parseQrPayload(payload: string): QrPayloadGroup[] | null {
  if (!payload || payload.length > MAX_QR_PAYLOAD_LENGTH) return null;

  const rawGroups = payload.split(";");
  const stores = new Set<string>();
  const groups: QrPayloadGroup[] = [];

  for (const rawGroup of rawGroups) {
    const match = rawGroup.match(PAYLOAD_GROUP);
    if (!match) return null;

    const [, store, rawMenuIds] = match;
    if (stores.has(store)) return null;

    const menuIds = rawMenuIds === "" ? [] : rawMenuIds.split(",");
    if (menuIds.some((menuId) => !SAFE_TOKEN.test(menuId))) return null;
    if (new Set(menuIds).size !== menuIds.length) return null;

    stores.add(store);
    groups.push({ store, menuIds });
  }

  return groups;
}

export function serializeQrPayload(groups: QrPayloadGroup[]) {
  return groups.map(({ store, menuIds }) => `${store}={${menuIds.join(",")}}`).join(";");
}

export function getStorePayload(payload: string, store: string) {
  if (!SAFE_TOKEN.test(store)) return null;
  const group = parseQrPayload(payload)?.find((candidate) => candidate.store === store);
  return group ? serializeQrPayload([group]) : null;
}

export function countQrMenus(payload: string) {
  return parseQrPayload(payload)?.reduce((total, group) => total + group.menuIds.length, 0) ?? 0;
}

export function countQrStores(payload: string) {
  return parseQrPayload(payload)?.filter((group) => group.menuIds.length > 0).length ?? 0;
}

export function createQrShareUrl(origin: string, payload: string) {
  if (!parseQrPayload(payload)) throw new Error("Invalid QR payload");
  const url = new URL("/", origin);
  url.searchParams.set("qr", payload);
  return url.toString();
}

export function readSharedQrPayload(search: string): SharedPayloadResult {
  const params = new URLSearchParams(search);
  if (!params.has("qr")) return { payload: null, error: null };
  if (params.getAll("qr").length !== 1) return { payload: null, error: "invalid" };

  const payload = params.get("qr") ?? "";
  return parseQrPayload(payload)
    ? { payload, error: null }
    : { payload: null, error: "invalid" };
}

export async function copyShareText(text: string, environment: CopyEnvironment) {
  if (environment.writeClipboard) {
    try {
      await environment.writeClipboard(text);
      return "clipboard" as const;
    } catch {
      // Clipboard permission can be denied even when the API exists.
    }
  }

  if (environment.fallbackCopy(text)) return "fallback" as const;
  throw new Error("Copy failed");
}
