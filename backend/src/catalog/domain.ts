import type {
  CatalogMenuDetail,
  CatalogMenuSummary,
  Category,
  Store,
  StoreKey,
} from "../../../shared/catalog/types.ts";

export type CatalogErrorCode = "VALIDATION_ERROR" | "STORE_NOT_FOUND" | "MENU_NOT_FOUND";

export class CatalogError extends Error {
  readonly code: CatalogErrorCode;

  constructor(code: CatalogErrorCode, message: string) {
    super(message);
    this.name = "CatalogError";
    this.code = code;
  }
}

export type CatalogManifest = {
  version: string;
  collectedAt: string;
  storeCounts: Partial<Record<StoreKey, number>>;
};

export type StoreCatalog = Store & {
  categories: readonly Category[];
};

export type CatalogMenuPage = {
  store: Store;
  menus: readonly CatalogMenuSummary[];
  nextCursor: string | null;
  catalogVersion: string;
};

export type ResolvedCatalogMenus = {
  store: Store;
  menus: readonly CatalogMenuDetail[];
  unknownMenuIds: readonly string[];
  catalogVersion: string;
};
