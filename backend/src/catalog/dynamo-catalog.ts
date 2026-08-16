import {
  BatchGetCommand,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

import {
  STORE_KEYS,
  type CatalogMenuDetail,
  type Category,
  type Store,
  type StoreKey,
} from "../../../shared/catalog/types.ts";
import { CatalogError, type CatalogManifest } from "./domain.ts";
import type { CatalogRepository, CatalogRepositoryPage, ListCatalogMenusInput } from "./repository.ts";

type DocumentClient = {
  send(command: unknown): Promise<unknown>;
};

type DynamoCatalogRepositoryOptions = {
  tableName: string;
  client: DocumentClient;
};

type GetResult = { Item?: Record<string, unknown> };
type QueryResult = {
  Items?: Record<string, unknown>[];
  LastEvaluatedKey?: Record<string, unknown>;
};
type BatchGetResult = {
  Responses?: Record<string, Record<string, unknown>[]>;
};

function encodeCursor(key: Record<string, unknown> | undefined): string | undefined {
  return key ? Buffer.from(JSON.stringify(key), "utf8").toString("base64url") : undefined;
}

function decodeCursor(cursor: string | undefined): Record<string, string> | undefined {
  if (!cursor) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
    const key = parsed as Record<string, unknown>;
    if (typeof key.pk !== "string" || typeof key.sk !== "string") throw new Error("invalid");
    return { pk: key.pk, sk: key.sk };
  } catch {
    throw new CatalogError("VALIDATION_ERROR", "cursor 형식이 올바르지 않습니다.");
  }
}

function values<T>(items: readonly Record<string, unknown>[] | undefined, field: string): T[] {
  return (items ?? []).flatMap((item) => item[field] ? [item[field] as T] : []);
}

export class DynamoCatalogRepository implements CatalogRepository {
  private readonly options: DynamoCatalogRepositoryOptions;

  constructor(options: DynamoCatalogRepositoryOptions) {
    this.options = options;
  }

  async getManifest(): Promise<CatalogManifest> {
    const result = await this.options.client.send(new GetCommand({
      TableName: this.options.tableName,
      Key: { pk: "CATALOG", sk: "VERSION" },
      ConsistentRead: true,
    })) as GetResult;
    const manifest = result.Item?.manifest as CatalogManifest | undefined;
    if (!manifest) throw new Error("Catalog manifest is missing");
    return manifest;
  }

  async listStores(): Promise<readonly Store[]> {
    const result = await this.options.client.send(new BatchGetCommand({
      RequestItems: {
        [this.options.tableName]: {
          Keys: STORE_KEYS.map((storeId) => ({ pk: `STORE#${storeId}`, sk: "META" })),
          ConsistentRead: true,
        },
      },
    })) as BatchGetResult;
    return values<Store>(result.Responses?.[this.options.tableName], "store");
  }

  async getStore(storeId: StoreKey): Promise<Store | undefined> {
    const result = await this.options.client.send(new GetCommand({
      TableName: this.options.tableName,
      Key: { pk: `STORE#${storeId}`, sk: "META" },
      ConsistentRead: true,
    })) as GetResult;
    return result.Item?.store as Store | undefined;
  }

  async listCategories(storeId: StoreKey): Promise<readonly Category[]> {
    const result = await this.options.client.send(new QueryCommand({
      TableName: this.options.tableName,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
      ExpressionAttributeValues: {
        ":pk": `STORE#${storeId}`,
        ":prefix": "CATEGORY#",
      },
      ConsistentRead: true,
    })) as QueryResult;
    return values<Category>(result.Items, "category");
  }

  async listMenus(input: ListCatalogMenusInput): Promise<CatalogRepositoryPage> {
    const result = await this.options.client.send(new QueryCommand({
      TableName: this.options.tableName,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
      ExpressionAttributeValues: {
        ":pk": `STORE#${input.storeId}`,
        ":prefix": input.categoryId ? `MENU#${input.categoryId}#` : "MENU#",
      },
      ExclusiveStartKey: decodeCursor(input.cursor),
      Limit: input.limit,
      ConsistentRead: true,
    })) as QueryResult;
    return {
      menus: values<CatalogMenuDetail>(result.Items, "menu"),
      nextCursor: encodeCursor(result.LastEvaluatedKey),
    };
  }

  async getMenu(menuId: string): Promise<CatalogMenuDetail | undefined> {
    const result = await this.options.client.send(new GetCommand({
      TableName: this.options.tableName,
      Key: { pk: `MENU#${menuId}`, sk: "META" },
      ConsistentRead: true,
    })) as GetResult;
    return result.Item?.menu as CatalogMenuDetail | undefined;
  }

  async getMenus(menuIds: readonly string[]): Promise<readonly CatalogMenuDetail[]> {
    if (menuIds.length === 0) return [];
    const result = await this.options.client.send(new BatchGetCommand({
      RequestItems: {
        [this.options.tableName]: {
          Keys: menuIds.map((menuId) => ({ pk: `MENU#${menuId}`, sk: "META" })),
          ConsistentRead: true,
        },
      },
    })) as BatchGetResult;
    return values<CatalogMenuDetail>(result.Responses?.[this.options.tableName], "menu");
  }
}
