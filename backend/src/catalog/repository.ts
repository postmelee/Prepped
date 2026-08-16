import type {
  CatalogMenuDetail,
  Category,
  Store,
  StoreKey,
} from "../../../shared/catalog/types.ts";
import type { CatalogManifest } from "./domain.ts";

export type ListCatalogMenusInput = {
  storeId: StoreKey;
  categoryId?: string;
  limit: number;
  cursor?: string;
};

export type CatalogRepositoryPage = {
  menus: readonly CatalogMenuDetail[];
  nextCursor?: string;
};

export interface CatalogRepository {
  getManifest(): Promise<CatalogManifest>;
  listStores(): Promise<readonly Store[]>;
  getStore(storeId: StoreKey): Promise<Store | undefined>;
  listCategories(storeId: StoreKey): Promise<readonly Category[]>;
  listMenus(input: ListCatalogMenusInput): Promise<CatalogRepositoryPage>;
  getMenu(menuId: string): Promise<CatalogMenuDetail | undefined>;
  getMenus(menuIds: readonly string[]): Promise<readonly CatalogMenuDetail[]>;
}

export class InMemoryCatalogRepository implements CatalogRepository {
  private readonly data: {
    manifest: CatalogManifest;
    stores: readonly Store[];
    categories: readonly Category[];
    menus: readonly CatalogMenuDetail[];
  };

  constructor(data: InMemoryCatalogRepository["data"]) {
    this.data = data;
  }

  async getManifest() {
    return structuredClone(this.data.manifest);
  }

  async listStores() {
    return structuredClone(this.data.stores);
  }

  async getStore(storeId: StoreKey) {
    const store = this.data.stores.find((candidate) => candidate.id === storeId);
    return store ? structuredClone(store) : undefined;
  }

  async listCategories(storeId: StoreKey) {
    return structuredClone(
      this.data.categories
        .filter((category) => category.storeId === storeId)
        .sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id)),
    );
  }

  async listMenus(input: ListCatalogMenusInput) {
    const offset = input.cursor ? Number.parseInt(input.cursor, 10) : 0;
    const filtered = this.data.menus
      .filter((menu) => menu.storeId === input.storeId && (!input.categoryId || menu.categoryId === input.categoryId))
      .sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id));
    const menus = filtered.slice(offset, offset + input.limit);
    const nextOffset = offset + menus.length;
    return {
      menus: structuredClone(menus),
      nextCursor: nextOffset < filtered.length ? String(nextOffset) : undefined,
    };
  }

  async getMenu(menuId: string) {
    const menu = this.data.menus.find((candidate) => candidate.id === menuId);
    return menu ? structuredClone(menu) : undefined;
  }

  async getMenus(menuIds: readonly string[]) {
    const requested = new Set(menuIds);
    return structuredClone(this.data.menus.filter((menu) => requested.has(menu.id)));
  }
}
