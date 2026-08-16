export type StoreKey = import("../../../shared/catalog/types.ts").StoreKey;
export type CatalogMenuDetail = import("../../../shared/catalog/types.ts").CatalogMenuDetail;
export type CatalogMenuSummary = import("../../../shared/catalog/types.ts").CatalogMenuSummary;
export type Category = import("../../../shared/catalog/types.ts").Category;
export type Store = import("../../../shared/catalog/types.ts").Store;

// SAM bundles backend/ in isolation. These runtime constants therefore stay
// inside the CodeUri while the erased aliases above use the shared type contract.
export const STORE_KEYS = ["mcdonald", "subway", "starbucks"] as const satisfies readonly StoreKey[];
export const QR_SAFE_ID = /^[A-Za-z0-9_-]+$/;
