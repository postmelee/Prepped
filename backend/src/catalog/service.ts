import { QR_SAFE_ID } from "../../../shared/catalog/schema.ts";
import {
  STORE_KEYS,
  type CatalogMenuDetail,
  type CatalogMenuSummary,
  type StoreKey,
} from "../../../shared/catalog/types.ts";
import { CatalogError, type CatalogMenuPage, type ResolvedCatalogMenus, type StoreCatalog } from "./domain.ts";
import type { CatalogRepository } from "./repository.ts";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;
const MAX_RESOLVE_IDS = 20;

function isStoreKey(value: string): value is StoreKey {
  return STORE_KEYS.includes(value as StoreKey);
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

export class CatalogService {
  private readonly repository: CatalogRepository;

  constructor(repository: CatalogRepository) {
    this.repository = repository;
  }

  async listStores(): Promise<{ stores: readonly StoreCatalog[]; catalogVersion: string }> {
    const [stores, manifest] = await Promise.all([
      this.repository.listStores(),
      this.repository.getManifest(),
    ]);
    const sortedStores = [...stores].sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id));
    const withCategories = await Promise.all(sortedStores.map(async (store) => ({
      ...store,
      categories: await this.repository.listCategories(store.id),
    })));
    return { stores: withCategories, catalogVersion: manifest.version };
  }

  async listMenus(input: {
    storeId: string;
    categoryId?: string;
    limit?: number;
    cursor?: string;
  }): Promise<CatalogMenuPage> {
    const store = await this.requireStore(input.storeId);
    const limit = input.limit ?? DEFAULT_LIMIT;
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      throw new CatalogError("VALIDATION_ERROR", `limit은 1 이상 ${MAX_LIMIT} 이하여야 합니다.`);
    }
    if (input.categoryId) {
      const categories = await this.repository.listCategories(store.id);
      if (!categories.some((category) => category.id === input.categoryId)) {
        throw new CatalogError("VALIDATION_ERROR", "선택한 매장에 없는 카테고리입니다.");
      }
    }
    const [page, manifest] = await Promise.all([
      this.repository.listMenus({
        storeId: store.id,
        categoryId: input.categoryId,
        limit,
        cursor: input.cursor,
      }),
      this.repository.getManifest(),
    ]);
    return {
      store,
      menus: page.menus.filter((menu) => menu.isAvailable).map(toSummary),
      nextCursor: page.nextCursor ?? null,
      catalogVersion: manifest.version,
    };
  }

  async getMenu(menuId: string): Promise<{ menu: CatalogMenuDetail; catalogVersion: string }> {
    this.requireMenuId(menuId);
    const [menu, manifest] = await Promise.all([
      this.repository.getMenu(menuId),
      this.repository.getManifest(),
    ]);
    if (!menu) throw new CatalogError("MENU_NOT_FOUND", "메뉴를 찾을 수 없습니다.");
    return { menu, catalogVersion: manifest.version };
  }

  async resolveMenus(input: { storeId: string; menuIds: readonly string[] }): Promise<ResolvedCatalogMenus> {
    const store = await this.requireStore(input.storeId);
    if (!Array.isArray(input.menuIds) || input.menuIds.length > MAX_RESOLVE_IDS) {
      throw new CatalogError("VALIDATION_ERROR", `메뉴 ID는 ${MAX_RESOLVE_IDS}개 이하로 보내주세요.`);
    }
    const menuIds = [...new Set(input.menuIds)];
    menuIds.forEach((menuId) => this.requireMenuId(menuId));
    const [foundMenus, manifest] = await Promise.all([
      this.repository.getMenus(menuIds),
      this.repository.getManifest(),
    ]);
    const byId = new Map(foundMenus.map((menu) => [menu.id, menu]));
    const menus: CatalogMenuDetail[] = [];
    const unknownMenuIds: string[] = [];
    menuIds.forEach((menuId) => {
      const menu = byId.get(menuId);
      if (!menu || menu.storeId !== store.id || !menu.isAvailable) unknownMenuIds.push(menuId);
      else menus.push(menu);
    });
    return { store, menus, unknownMenuIds, catalogVersion: manifest.version };
  }

  private async requireStore(storeId: string) {
    if (!isStoreKey(storeId)) throw new CatalogError("STORE_NOT_FOUND", "지원하지 않는 매장입니다.");
    const store = await this.repository.getStore(storeId);
    if (!store) throw new CatalogError("STORE_NOT_FOUND", "매장을 찾을 수 없습니다.");
    return store;
  }

  private requireMenuId(menuId: unknown): asserts menuId is string {
    if (typeof menuId !== "string" || !QR_SAFE_ID.test(menuId)) {
      throw new CatalogError("VALIDATION_ERROR", "메뉴 ID 형식이 올바르지 않습니다.");
    }
  }
}
