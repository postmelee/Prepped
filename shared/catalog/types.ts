export const STORE_KEYS = ["mcdonald", "subway", "starbucks"] as const;

export type StoreKey = (typeof STORE_KEYS)[number];
export type PriceType = "official" | "estimated";
export type ImageUsage = "reference-only" | "approved-remote" | "placeholder";
export type SelectionMode = "single" | "multiple";

export type Money = {
  amount: number;
  currency: "KRW";
  type: PriceType;
  sourceUrl?: string;
  note?: string;
};

export type SourceReference = {
  provider: StoreKey;
  productId: string;
  productUrl: string;
  imageUrl?: string;
  imageUsage: ImageUsage;
  collectedAt: string;
};

export type Store = {
  id: StoreKey;
  name: string;
  shortName: string;
  sortOrder: number;
  sourceUrl: string;
};

export type Category = {
  id: string;
  storeId: StoreKey;
  name: string;
  sortOrder: number;
};

export type OptionValue = {
  id: string;
  name: string;
  priceDelta: number;
  isDefault?: boolean;
};

export type OptionGroup = {
  id: string;
  storeId: StoreKey;
  name: string;
  selectionMode: SelectionMode;
  minSelections: number;
  maxSelections: number;
  values: readonly OptionValue[];
};

export type MenuVariant = {
  label: string;
  attributes: Readonly<Record<string, string>>;
};

export type MenuItem = {
  id: string;
  storeId: StoreKey;
  categoryId: string;
  baseProductId: string;
  name: string;
  description?: string;
  variant?: MenuVariant;
  price: Money;
  optionGroupIds: readonly string[];
  source: SourceReference;
  isAvailable: boolean;
  sortOrder: number;
};

export type CatalogSnapshot = {
  version: string;
  locale: "ko-KR";
  collectedAt: string;
  stores: readonly Store[];
  categories: readonly Category[];
  optionGroups: readonly OptionGroup[];
  menus: readonly MenuItem[];
};

export type CatalogMenuSummary = Pick<
  MenuItem,
  "id" | "storeId" | "categoryId" | "name" | "description" | "variant" | "price" | "source" | "isAvailable"
>;

export type ResolveMenusRequest = {
  storeId: StoreKey;
  menuIds: readonly string[];
};

export type ResolveMenusResult = {
  store: Store;
  menus: readonly MenuItem[];
  unknownMenuIds: readonly string[];
};
