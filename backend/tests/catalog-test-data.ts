import type { CatalogMenuDetail, CatalogSnapshot } from "../../shared/catalog/types.ts";
import type { CatalogManifest } from "../src/catalog/domain.ts";

export const collectedAt = "2026-08-16T06:00:00Z";

export const catalogSnapshot: CatalogSnapshot = {
  version: "2026-08-16",
  locale: "ko-KR",
  collectedAt,
  stores: [
    { id: "mcdonald", name: "맥도날드", shortName: "맥도날드", sortOrder: 1, sourceUrl: "https://www.mcdonalds.co.kr/kor/menu/list.do" },
    { id: "subway", name: "써브웨이", shortName: "서브웨이", sortOrder: 2, sourceUrl: "https://www.subway.co.kr/menuList/sandwich" },
    { id: "starbucks", name: "스타벅스", shortName: "스타벅스", sortOrder: 3, sourceUrl: "https://www.starbucks.co.kr/menu/drink_list.do" },
  ],
  categories: [
    { id: "burger", storeId: "mcdonald", name: "버거", sortOrder: 1 },
    { id: "sandwich", storeId: "subway", name: "샌드위치", sortOrder: 1 },
    { id: "espresso", storeId: "starbucks", name: "에스프레소", sortOrder: 1 },
  ],
  optionGroups: [
    {
      id: "mcdonald-serving",
      storeId: "mcdonald",
      name: "구성",
      selectionMode: "single",
      minSelections: 1,
      maxSelections: 1,
      values: [{ id: "single", name: "단품", priceDelta: 0, isDefault: true }],
    },
  ],
  menus: [
    {
      id: "mcdonald-big-mac",
      storeId: "mcdonald",
      categoryId: "burger",
      baseProductId: "178",
      name: "빅맥",
      price: { amount: 6300, currency: "KRW", type: "estimated" },
      optionGroupIds: ["mcdonald-serving"],
      source: {
        provider: "mcdonald",
        productId: "178",
        productUrl: "https://www.mcdonalds.co.kr/kor/menu/detail.do?seq=178",
        imageUsage: "reference-only",
        collectedAt,
      },
      isAvailable: true,
      sortOrder: 1,
    },
    {
      id: "subway-egg-mayo-15cm",
      storeId: "subway",
      categoryId: "sandwich",
      baseProductId: "43",
      name: "에그마요",
      variant: { label: "15cm", attributes: { length: "15cm" } },
      price: { amount: 6200, currency: "KRW", type: "official" },
      optionGroupIds: [],
      source: {
        provider: "subway",
        productId: "43",
        productUrl: "https://www.subway.co.kr/menuList/sandwich",
        imageUsage: "reference-only",
        collectedAt,
      },
      isAvailable: true,
      sortOrder: 1,
    },
    {
      id: "starbucks-caffe-americano-hot",
      storeId: "starbucks",
      categoryId: "espresso",
      baseProductId: "94",
      name: "카페 아메리카노",
      variant: { label: "HOT", attributes: { temperature: "hot" } },
      price: { amount: 4700, currency: "KRW", type: "estimated" },
      optionGroupIds: [],
      source: {
        provider: "starbucks",
        productId: "94",
        productUrl: "https://www.starbucks.co.kr/menu/drink_list.do",
        imageUsage: "reference-only",
        collectedAt,
      },
      isAvailable: true,
      sortOrder: 1,
    },
  ],
};

export const catalogManifest: CatalogManifest = {
  version: catalogSnapshot.version,
  collectedAt,
  storeCounts: { mcdonald: 1, subway: 1, starbucks: 1 },
};

export const catalogMenus: CatalogMenuDetail[] = catalogSnapshot.menus.map((menu) => ({
  ...menu,
  optionGroups: catalogSnapshot.optionGroups.filter((group) => menu.optionGroupIds.includes(group.id)),
}));
