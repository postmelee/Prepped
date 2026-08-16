import { STORE_KEYS, type CatalogSnapshot, type StoreKey } from "./types.ts";

export const QR_SAFE_ID = /^[A-Za-z0-9_-]+$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStoreKey(value: unknown): value is StoreKey {
  return typeof value === "string" && STORE_KEYS.includes(value as StoreKey);
}

function requireString(record: Record<string, unknown>, key: string, path: string, errors: string[]) {
  if (typeof record[key] !== "string" || record[key].length === 0) {
    errors.push(`${path}.${key} must be a non-empty string`);
  }
}

function validateUniqueIds(
  values: readonly unknown[],
  path: string,
  errors: string[],
  ownerKey?: string,
) {
  const seen = new Set<string>();
  values.forEach((value, index) => {
    if (!isRecord(value) || typeof value.id !== "string") return;
    const owner = ownerKey && typeof value[ownerKey] === "string" ? `${value[ownerKey]}:` : "";
    const identity = `${owner}${value.id}`;
    if (seen.has(identity)) errors.push(`${path}[${index}].id duplicates ${identity}`);
    seen.add(identity);
  });
}

export function collectCatalogErrors(value: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) return ["catalog must be an object"];

  requireString(value, "version", "catalog", errors);
  if (value.locale !== "ko-KR") errors.push("catalog.locale must be ko-KR");
  if (typeof value.collectedAt !== "string" || !ISO_DATE.test(value.collectedAt)) {
    errors.push("catalog.collectedAt must be a UTC ISO timestamp");
  }

  for (const key of ["stores", "categories", "optionGroups", "menus"] as const) {
    if (!Array.isArray(value[key])) errors.push(`catalog.${key} must be an array`);
  }
  if (errors.some((error) => error.endsWith("must be an array"))) return errors;

  const stores = value.stores as unknown[];
  const categories = value.categories as unknown[];
  const optionGroups = value.optionGroups as unknown[];
  const menus = value.menus as unknown[];
  const storeIds = new Set<StoreKey>();
  const categoryIds = new Set<string>();
  const optionGroupIds = new Set<string>();

  validateUniqueIds(stores, "catalog.stores", errors);
  validateUniqueIds(categories, "catalog.categories", errors, "storeId");
  validateUniqueIds(optionGroups, "catalog.optionGroups", errors);
  validateUniqueIds(menus, "catalog.menus", errors);

  stores.forEach((entry, index) => {
    const path = `catalog.stores[${index}]`;
    if (!isRecord(entry)) return errors.push(`${path} must be an object`);
    if (!isStoreKey(entry.id)) errors.push(`${path}.id must be a supported store key`);
    else storeIds.add(entry.id);
    requireString(entry, "name", path, errors);
    requireString(entry, "shortName", path, errors);
    requireString(entry, "sourceUrl", path, errors);
    if (!Number.isInteger(entry.sortOrder)) errors.push(`${path}.sortOrder must be an integer`);
  });

  categories.forEach((entry, index) => {
    const path = `catalog.categories[${index}]`;
    if (!isRecord(entry)) return errors.push(`${path} must be an object`);
    if (typeof entry.id !== "string" || !QR_SAFE_ID.test(entry.id)) errors.push(`${path}.id must be QR-safe`);
    if (!isStoreKey(entry.storeId) || !storeIds.has(entry.storeId)) errors.push(`${path}.storeId is unknown`);
    requireString(entry, "name", path, errors);
    if (!Number.isInteger(entry.sortOrder)) errors.push(`${path}.sortOrder must be an integer`);
    if (typeof entry.id === "string" && isStoreKey(entry.storeId)) {
      categoryIds.add(`${entry.storeId}:${entry.id}`);
    }
  });

  optionGroups.forEach((entry, index) => {
    const path = `catalog.optionGroups[${index}]`;
    if (!isRecord(entry)) return errors.push(`${path} must be an object`);
    if (typeof entry.id !== "string" || !QR_SAFE_ID.test(entry.id)) errors.push(`${path}.id must be QR-safe`);
    if (!isStoreKey(entry.storeId) || !storeIds.has(entry.storeId)) errors.push(`${path}.storeId is unknown`);
    requireString(entry, "name", path, errors);
    if (entry.selectionMode !== "single" && entry.selectionMode !== "multiple") {
      errors.push(`${path}.selectionMode must be single or multiple`);
    }
    if (!Number.isInteger(entry.minSelections) || !Number.isInteger(entry.maxSelections)) {
      errors.push(`${path} selection bounds must be integers`);
    } else if ((entry.minSelections as number) < 0 || (entry.maxSelections as number) < (entry.minSelections as number)) {
      errors.push(`${path} selection bounds are invalid`);
    }
    if (!Array.isArray(entry.values) || entry.values.length === 0) {
      errors.push(`${path}.values must be a non-empty array`);
    } else {
      validateUniqueIds(entry.values, `${path}.values`, errors);
      entry.values.forEach((value, valueIndex) => {
        const valuePath = `${path}.values[${valueIndex}]`;
        if (!isRecord(value)) return errors.push(`${valuePath} must be an object`);
        if (typeof value.id !== "string" || !QR_SAFE_ID.test(value.id)) errors.push(`${valuePath}.id must be QR-safe`);
        requireString(value, "name", valuePath, errors);
        if (!Number.isInteger(value.priceDelta)) errors.push(`${valuePath}.priceDelta must be an integer`);
      });
    }
    if (typeof entry.id === "string") optionGroupIds.add(entry.id);
  });

  menus.forEach((entry, index) => {
    const path = `catalog.menus[${index}]`;
    if (!isRecord(entry)) return errors.push(`${path} must be an object`);
    if (typeof entry.id !== "string" || !QR_SAFE_ID.test(entry.id)) errors.push(`${path}.id must be QR-safe`);
    if (!isStoreKey(entry.storeId) || !storeIds.has(entry.storeId)) errors.push(`${path}.storeId is unknown`);
    if (typeof entry.categoryId !== "string" || !categoryIds.has(`${entry.storeId}:${entry.categoryId}`)) {
      errors.push(`${path}.categoryId is unknown for the store`);
    }
    requireString(entry, "baseProductId", path, errors);
    requireString(entry, "name", path, errors);
    if (!isRecord(entry.price)) {
      errors.push(`${path}.price must be an object`);
    } else {
      if (!Number.isInteger(entry.price.amount) || (entry.price.amount as number) < 0) {
        errors.push(`${path}.price.amount must be a non-negative integer`);
      }
      if (entry.price.currency !== "KRW") errors.push(`${path}.price.currency must be KRW`);
      if (entry.price.type !== "official" && entry.price.type !== "estimated") {
        errors.push(`${path}.price.type must be official or estimated`);
      }
    }
    if (!Array.isArray(entry.optionGroupIds)) {
      errors.push(`${path}.optionGroupIds must be an array`);
    } else {
      entry.optionGroupIds.forEach((id) => {
        if (typeof id !== "string" || !optionGroupIds.has(id)) errors.push(`${path}.optionGroupIds contains unknown ${String(id)}`);
      });
    }
    if (!isRecord(entry.source)) {
      errors.push(`${path}.source must be an object`);
    } else {
      if (entry.source.provider !== entry.storeId) errors.push(`${path}.source.provider must match storeId`);
      requireString(entry.source, "productId", `${path}.source`, errors);
      requireString(entry.source, "productUrl", `${path}.source`, errors);
      if (typeof entry.source.collectedAt !== "string" || !ISO_DATE.test(entry.source.collectedAt)) {
        errors.push(`${path}.source.collectedAt must be a UTC ISO timestamp`);
      }
      if (!["reference-only", "approved-remote", "placeholder"].includes(String(entry.source.imageUsage))) {
        errors.push(`${path}.source.imageUsage is invalid`);
      }
    }
    if (typeof entry.isAvailable !== "boolean") errors.push(`${path}.isAvailable must be boolean`);
    if (!Number.isInteger(entry.sortOrder)) errors.push(`${path}.sortOrder must be an integer`);
  });

  return errors;
}

export function assertCatalogSnapshot(value: unknown): asserts value is CatalogSnapshot {
  const errors = collectCatalogErrors(value);
  if (errors.length > 0) throw new TypeError(`Invalid catalog snapshot:\n- ${errors.join("\n- ")}`);
}
