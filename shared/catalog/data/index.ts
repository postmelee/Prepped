import { assertCatalogSnapshot } from "../schema.ts";
import type {
  CatalogMenuDetail,
  CatalogSnapshot,
  Category,
  MenuItem,
  Money,
  OptionGroup,
  Store,
  StoreKey,
} from "../types.ts";
import { MCDONALD_RAW_MENUS } from "./mcdonald.ts";
import { STARBUCKS_RAW_MENUS } from "./starbucks.ts";
import { SUBWAY_RAW_MENUS } from "./subway.ts";

export const CATALOG_COLLECTED_AT = "2026-08-16T07:00:00Z";
export const CATALOG_VERSION = "2026-08-16.1";

export const CATALOG_STORES: readonly Store[] = [
  {
    id: "mcdonald",
    name: "맥도날드",
    shortName: "맥도날드",
    sortOrder: 1,
    sourceUrl: "https://www.mcdonalds.co.kr/kor/menu/burger",
  },
  {
    id: "subway",
    name: "써브웨이",
    shortName: "서브웨이",
    sortOrder: 2,
    sourceUrl: "https://www.subway.co.kr/menuList/sandwich",
  },
  {
    id: "starbucks",
    name: "스타벅스",
    shortName: "스타벅스",
    sortOrder: 3,
    sourceUrl: "https://www.starbucks.co.kr/menu/drink_list.do",
  },
];

const categoryDefinitions: Readonly<Record<StoreKey, readonly [string, string][]>> = {
  mcdonald: [
    ["burger", "버거"],
    ["side-dessert", "사이드·디저트"],
    ["breakfast", "맥모닝"],
    ["happy-meal", "해피밀"],
    ["beverage", "맥카페·음료"],
  ],
  subway: [
    ["sandwich", "샌드위치"],
    ["grain-salad", "그레인 샐러드"],
    ["salad", "샐러드"],
    ["unit", "랩·기타"],
    ["morning", "아침메뉴"],
    ["sidedrink", "스마일 썹"],
  ],
  starbucks: [
    ["drink-cold-brew", "콜드 브루"],
    ["drink-brewed", "브루드 커피"],
    ["drink-espresso", "에스프레소"],
    ["drink-frappuccino", "프라푸치노"],
    ["drink-blended", "블렌디드"],
    ["drink-refresher", "리프레셔"],
    ["drink-fizzio", "피지오"],
    ["drink-tea", "티"],
    ["drink-etc", "기타 제조 음료"],
    ["drink-juice", "주스·병음료"],
    ["food-bakery", "브레드"],
    ["food-cake", "케이크"],
    ["food-sandwich", "샌드위치·샐러드"],
    ["food-hot-food", "따뜻한 푸드"],
    ["food-fruit-yogurt", "과일·요거트"],
    ["food-snack", "스낵·미니 디저트"],
    ["food-icecream", "아이스크림"],
  ],
};

export const CATALOG_CATEGORIES: readonly Category[] = CATALOG_STORES.flatMap((store) =>
  categoryDefinitions[store.id].map(([id, name], index) => ({
    id,
    storeId: store.id,
    name,
    sortOrder: index + 1,
  })),
);

const subwayToppings = SUBWAY_RAW_MENUS.filter(([, , , categoryId, className]) =>
  className.endsWith(".TOPPING") || (categoryId === "grain-salad" && className.endsWith(".ETC")),
);

export const CATALOG_OPTION_GROUPS: readonly OptionGroup[] = [
  {
    id: "mcdonald-serving",
    storeId: "mcdonald",
    name: "구성",
    selectionMode: "single",
    minSelections: 1,
    maxSelections: 1,
    values: [
      { id: "single", name: "단품", priceDelta: 0, isDefault: true },
      { id: "set", name: "세트", priceDelta: 2500 },
      { id: "lunch", name: "맥런치 세트", priceDelta: 2000 },
    ],
  },
  {
    id: "mcdonald-burger-custom",
    storeId: "mcdonald",
    name: "재료 빼기",
    selectionMode: "multiple",
    minSelections: 0,
    maxSelections: 3,
    values: [
      { id: "no-pickle", name: "피클 빼기", priceDelta: 0 },
      { id: "no-onion", name: "양파 빼기", priceDelta: 0 },
      { id: "no-sauce", name: "소스 빼기", priceDelta: 0 },
    ],
  },
  {
    id: "subway-bread",
    storeId: "subway",
    name: "빵",
    selectionMode: "single",
    minSelections: 1,
    maxSelections: 1,
    values: [
      { id: "white", name: "화이트", priceDelta: 0, isDefault: true },
      { id: "wheat", name: "위트", priceDelta: 0 },
      { id: "flatbread", name: "플랫브레드", priceDelta: 0 },
      { id: "parmesan-oregano", name: "파마산 오레가노", priceDelta: 0 },
      { id: "honey-oat", name: "허니오트", priceDelta: 0 },
      { id: "hearty-italian", name: "하티 이탈리안", priceDelta: 0 },
    ],
  },
  {
    id: "subway-cheese",
    storeId: "subway",
    name: "치즈",
    selectionMode: "single",
    minSelections: 0,
    maxSelections: 1,
    values: [
      { id: "american", name: "아메리칸 치즈", priceDelta: 0, isDefault: true },
      { id: "shredded", name: "슈레드 치즈", priceDelta: 0 },
      { id: "mozzarella", name: "모차렐라 치즈", priceDelta: 0 },
      { id: "none", name: "치즈 제외", priceDelta: 0 },
    ],
  },
  {
    id: "subway-vegetables",
    storeId: "subway",
    name: "야채",
    selectionMode: "multiple",
    minSelections: 0,
    maxSelections: 9,
    values: [
      { id: "lettuce", name: "양상추", priceDelta: 0, isDefault: true },
      { id: "tomato", name: "토마토", priceDelta: 0, isDefault: true },
      { id: "cucumber", name: "오이", priceDelta: 0, isDefault: true },
      { id: "pickle", name: "피클", priceDelta: 0, isDefault: true },
      { id: "olive", name: "올리브", priceDelta: 0, isDefault: true },
      { id: "onion", name: "양파", priceDelta: 0, isDefault: true },
      { id: "pepper", name: "피망", priceDelta: 0, isDefault: true },
      { id: "jalapeno", name: "할라피뇨", priceDelta: 0, isDefault: true },
      { id: "avocado", name: "아보카도", priceDelta: 1300 },
    ],
  },
  {
    id: "subway-sauce",
    storeId: "subway",
    name: "소스",
    selectionMode: "multiple",
    minSelections: 0,
    maxSelections: 3,
    values: [
      { id: "ranch", name: "랜치", priceDelta: 0 },
      { id: "mayonnaise", name: "마요네즈", priceDelta: 0 },
      { id: "sweet-onion", name: "스위트 어니언", priceDelta: 0, isDefault: true },
      { id: "honey-mustard", name: "허니 머스타드", priceDelta: 0 },
      { id: "sweet-chili", name: "스위트 칠리", priceDelta: 0 },
      { id: "hot-chili", name: "핫 칠리", priceDelta: 0 },
      { id: "barbecue", name: "바비큐", priceDelta: 0 },
      { id: "oil-vinegar", name: "오일·식초", priceDelta: 0 },
    ],
  },
  {
    id: "subway-extra",
    storeId: "subway",
    name: "추가 토핑",
    selectionMode: "multiple",
    minSelections: 0,
    maxSelections: 4,
    values: [...new Map(subwayToppings.map(([sourceId, name]) => [name, {
      id: `extra-${sourceId}`,
      name,
      priceDelta: 1000,
    }])).values()],
  },
  {
    id: "starbucks-size",
    storeId: "starbucks",
    name: "사이즈",
    selectionMode: "single",
    minSelections: 1,
    maxSelections: 1,
    values: [
      { id: "tall", name: "Tall", priceDelta: 0, isDefault: true },
      { id: "grande", name: "Grande", priceDelta: 500 },
      { id: "venti", name: "Venti", priceDelta: 1000 },
    ],
  },
  {
    id: "starbucks-shot",
    storeId: "starbucks",
    name: "에스프레소 샷",
    selectionMode: "single",
    minSelections: 1,
    maxSelections: 1,
    values: [
      { id: "standard", name: "기본", priceDelta: 0, isDefault: true },
      { id: "extra-one", name: "샷 1회 추가", priceDelta: 600 },
      { id: "extra-two", name: "샷 2회 추가", priceDelta: 1200 },
    ],
  },
  {
    id: "starbucks-milk",
    storeId: "starbucks",
    name: "우유",
    selectionMode: "single",
    minSelections: 1,
    maxSelections: 1,
    values: [
      { id: "regular", name: "일반 우유", priceDelta: 0, isDefault: true },
      { id: "low-fat", name: "저지방 우유", priceDelta: 0 },
      { id: "soy", name: "두유", priceDelta: 0 },
      { id: "oat", name: "오트 음료", priceDelta: 0 },
    ],
  },
  {
    id: "starbucks-syrup",
    storeId: "starbucks",
    name: "시럽",
    selectionMode: "multiple",
    minSelections: 0,
    maxSelections: 3,
    values: [
      { id: "vanilla", name: "바닐라", priceDelta: 600 },
      { id: "caramel", name: "카라멜", priceDelta: 600 },
      { id: "hazelnut", name: "헤이즐넛", priceDelta: 600 },
      { id: "mocha", name: "모카", priceDelta: 600 },
    ],
  },
  {
    id: "starbucks-whipped",
    storeId: "starbucks",
    name: "휘핑",
    selectionMode: "single",
    minSelections: 0,
    maxSelections: 1,
    values: [
      { id: "standard", name: "기본", priceDelta: 0, isDefault: true },
      { id: "none", name: "휘핑 제외", priceDelta: 0 },
      { id: "extra", name: "휘핑 많이", priceDelta: 0 },
    ],
  },
  {
    id: "starbucks-warming",
    storeId: "starbucks",
    name: "데우기",
    selectionMode: "single",
    minSelections: 1,
    maxSelections: 1,
    values: [
      { id: "as-is", name: "그대로", priceDelta: 0, isDefault: true },
      { id: "warmed", name: "따뜻하게 데우기", priceDelta: 0 },
    ],
  },
];

function estimatedPrice(amount: number, sourceId: string, note: string): Money {
  const variance = Number.parseInt(sourceId.slice(-2), 10) % 4;
  return {
    amount: amount + variance * 500,
    currency: "KRW",
    type: "estimated",
    note,
  };
}

function mcdonaldMenus(): MenuItem[] {
  const basePrices: Record<string, number> = {
    burger: 6500,
    "side-dessert": 2500,
    breakfast: 4000,
    "happy-meal": 3500,
    beverage: 2500,
  };
  const categorySequences: Record<string, number> = {
    burger: 1,
    "side-dessert": 4,
    breakfast: 2,
    "happy-meal": 3,
    beverage: 5,
  };
  return MCDONALD_RAW_MENUS.map(([sourceId, name, imageUrl, categoryId, menuStatus], index) => ({
    id: `mcdonald-${sourceId}`,
    storeId: "mcdonald",
    categoryId,
    baseProductId: sourceId,
    name,
    variant: /\b(Small|Medium|Large)\b/.test(name)
      ? { label: name.match(/\b(Small|Medium|Large)\b/)?.[1] ?? "", attributes: { size: name.match(/\b(Small|Medium|Large)\b/)?.[1]?.toLowerCase() ?? "" } }
      : undefined,
    price: estimatedPrice(basePrices[categoryId] ?? 4000, sourceId, "공식 웹 메뉴에 가격이 없어 설정한 예상 가격"),
    optionGroupIds: [
      ...(menuStatus.includes("단품") && menuStatus.includes("세트") ? ["mcdonald-serving"] : []),
      ...(categoryId === "burger" ? ["mcdonald-burger-custom"] : []),
    ],
    source: {
      provider: "mcdonald",
      productId: sourceId,
      productUrl: `https://www.mcdonalds.co.kr/api/v1/kor/product/product/list?page=1&view_rows=200&mainCategory=${categorySequences[categoryId] ?? 1}`,
      imageUrl,
      imageUsage: "reference-only",
      collectedAt: CATALOG_COLLECTED_AT,
    },
    isAvailable: true,
    sortOrder: index + 1,
  }));
}

function subwayMenus(): MenuItem[] {
  const actualMenus = SUBWAY_RAW_MENUS.filter(([, , , categoryId, className]) =>
    !className.endsWith(".TOPPING") && !(categoryId === "grain-salad" && className.endsWith(".ETC")),
  );
  const basePrices: Record<string, number> = {
    sandwich: 7000,
    "grain-salad": 10500,
    salad: 9000,
    unit: 7500,
    morning: 4500,
    sidedrink: 2500,
  };
  return actualMenus.flatMap(([sourceId, name, imageUrl, categoryId], index) => {
    const lengths = categoryId === "sandwich" ? ["15cm", "30cm"] : [undefined];
    return lengths.map((length, variantIndex) => {
      const isOfficialEggMayo = sourceId === "1530" && length !== undefined;
      const estimatedBase = estimatedPrice(basePrices[categoryId] ?? 6000, sourceId, "공식 가격을 확인할 수 없어 설정한 예상 가격");
      const price: Money = isOfficialEggMayo
        ? {
            amount: length === "15cm" ? 6200 : 11800,
            currency: "KRW",
            type: "official",
            sourceUrl: "https://www.subway.co.kr/menuList/sandwich",
            note: "2026-08-16 공식 화면 확인값",
          }
        : {
            ...estimatedBase,
            amount: length === "30cm" ? Math.round(estimatedBase.amount * 1.8 / 100) * 100 : estimatedBase.amount,
          };
      return {
        id: `subway-${sourceId}${length ? `-${length}` : ""}`,
        storeId: "subway" as const,
        categoryId,
        baseProductId: sourceId,
        name,
        variant: length ? { label: length, attributes: { length } } : undefined,
        price,
        optionGroupIds: categoryId === "sandwich"
          ? ["subway-bread", "subway-cheese", "subway-vegetables", "subway-sauce", "subway-extra"]
          : categoryId === "salad" || categoryId === "grain-salad"
            ? ["subway-vegetables", "subway-sauce", "subway-extra"]
            : [],
        source: {
          provider: "subway" as const,
          productId: sourceId,
          productUrl: `https://www.subway.co.kr/menuList/${categoryId.replaceAll("-", "_")}`,
          imageUrl,
          imageUsage: "reference-only" as const,
          collectedAt: CATALOG_COLLECTED_AT,
        },
        isAvailable: true,
        sortOrder: (index + 1) * 2 + variantIndex,
      };
    });
  });
}

function starbucksMenus(): MenuItem[] {
  const names = new Set<string>(STARBUCKS_RAW_MENUS.map(([, name]) => name));
  return STARBUCKS_RAW_MENUS.map(([sourceId, name, imageUrl, categoryId, kind], index) => {
    const isDrink = kind === "drink";
    const isIced = name.startsWith("아이스 ") || ["drink-cold-brew", "drink-frappuccino", "drink-blended", "drink-refresher", "drink-fizzio", "drink-juice"].includes(categoryId);
    const hasIcedPair = !name.startsWith("아이스 ") && names.has(`아이스 ${name}`);
    const drinkBase = categoryId === "drink-juice" ? 4500 : categoryId === "drink-espresso" ? 4700 : 5500;
    const foodBase = categoryId === "food-cake" ? 6500 : categoryId === "food-sandwich" ? 7000 : 4000;
    return {
      id: `starbucks-${sourceId}`,
      storeId: "starbucks",
      categoryId,
      baseProductId: sourceId,
      name,
      variant: isDrink && (isIced || hasIcedPair)
        ? { label: isIced ? "ICED" : "HOT", attributes: { temperature: isIced ? "iced" : "hot" } }
        : undefined,
      price: estimatedPrice(isDrink ? drinkBase : foodBase, sourceId, "공식 웹 메뉴에 가격이 없어 설정한 예상 가격"),
      optionGroupIds: isDrink && categoryId !== "drink-juice"
        ? ["starbucks-size", "starbucks-shot", "starbucks-milk", "starbucks-syrup", "starbucks-whipped"]
        : !isDrink && ["food-bakery", "food-sandwich", "food-hot-food"].includes(categoryId)
          ? ["starbucks-warming"]
          : [],
      source: {
        provider: "starbucks",
        productId: sourceId,
        productUrl: `https://www.starbucks.co.kr/menu/${isDrink ? "drink" : "food"}_view.do?product_cd=${sourceId}`,
        imageUrl,
        imageUsage: "reference-only",
        collectedAt: CATALOG_COLLECTED_AT,
      },
      isAvailable: true,
      sortOrder: index + 1,
    };
  });
}

export const CATALOG_SNAPSHOT: CatalogSnapshot = {
  version: CATALOG_VERSION,
  locale: "ko-KR",
  collectedAt: CATALOG_COLLECTED_AT,
  stores: CATALOG_STORES,
  categories: CATALOG_CATEGORIES,
  optionGroups: CATALOG_OPTION_GROUPS,
  menus: [...mcdonaldMenus(), ...subwayMenus(), ...starbucksMenus()],
};

assertCatalogSnapshot(CATALOG_SNAPSHOT);

export const CATALOG_MENU_DETAILS: readonly CatalogMenuDetail[] = CATALOG_SNAPSHOT.menus.map((menu) => ({
  ...menu,
  optionGroups: CATALOG_OPTION_GROUPS.filter((group) => menu.optionGroupIds.includes(group.id)),
}));

export const CATALOG_COUNTS: Readonly<Record<StoreKey, number>> = Object.fromEntries(
  CATALOG_STORES.map((store) => [store.id, CATALOG_SNAPSHOT.menus.filter((menu) => menu.storeId === store.id).length]),
) as Record<StoreKey, number>;

export type CatalogDynamoItem = {
  pk: string;
  sk: string;
  entity: "CATALOG_MANIFEST" | "STORE" | "CATEGORY" | "MENU_LIST" | "MENU_LOOKUP";
  manifest?: { version: string; collectedAt: string; storeCounts: Readonly<Record<StoreKey, number>> };
  store?: Store;
  category?: Category;
  menu?: CatalogMenuDetail;
};

function paddedSort(value: number) {
  return String(value).padStart(5, "0");
}

export function buildCatalogDynamoItems(): CatalogDynamoItem[] {
  const manifest: CatalogDynamoItem = {
    pk: "CATALOG",
    sk: "VERSION",
    entity: "CATALOG_MANIFEST",
    manifest: { version: CATALOG_VERSION, collectedAt: CATALOG_COLLECTED_AT, storeCounts: CATALOG_COUNTS },
  };
  const stores = CATALOG_STORES.map((store): CatalogDynamoItem => ({
    pk: `STORE#${store.id}`,
    sk: "META",
    entity: "STORE",
    store,
  }));
  const categories = CATALOG_CATEGORIES.map((category): CatalogDynamoItem => ({
    pk: `STORE#${category.storeId}`,
    sk: `CATEGORY#${paddedSort(category.sortOrder)}#${category.id}`,
    entity: "CATEGORY",
    category,
  }));
  const menus = CATALOG_MENU_DETAILS.flatMap((menu): CatalogDynamoItem[] => [
    {
      pk: `STORE#${menu.storeId}`,
      sk: `MENU#${menu.categoryId}#${paddedSort(menu.sortOrder)}#${menu.id}`,
      entity: "MENU_LIST",
      menu,
    },
    {
      pk: `MENU#${menu.id}`,
      sk: "META",
      entity: "MENU_LOOKUP",
      menu,
    },
  ]);
  return [manifest, ...stores, ...categories, ...menus];
}
