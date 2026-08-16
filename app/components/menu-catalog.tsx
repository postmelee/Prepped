import { useState } from "react";

import type { CatalogMenuSummary, Category, StoreKey } from "../../shared/catalog/types.ts";
import type { StoreCatalog } from "../lib/catalog/client.ts";

export type CatalogStep = "store" | "category" | "menu";

const STORE_MARKS: Readonly<Record<StoreKey, string>> = {
  mcdonald: "M",
  subway: "S",
  starbucks: "★",
};

const CATEGORY_ICONS: Readonly<Record<string, string>> = {
  burger: "🍔",
  "side-dessert": "🍟",
  breakfast: "🥞",
  "happy-meal": "🙂",
  beverage: "🥤",
  sandwich: "🥪",
  "grain-salad": "🥗",
  salad: "🥗",
  unit: "🌯",
  morning: "☀️",
  sidedrink: "🍪",
  "drink-cold-brew": "🧊",
  "drink-brewed": "☕",
  "drink-espresso": "☕",
  "drink-frappuccino": "🥤",
  "drink-blended": "🍹",
  "drink-refresher": "🍓",
  "drink-fizzio": "✨",
  "drink-tea": "🍵",
  "drink-etc": "🥛",
  "drink-juice": "🧃",
  "food-bakery": "🥐",
  "food-cake": "🍰",
  "food-sandwich": "🥪",
  "food-hot-food": "🍲",
  "food-fruit-yogurt": "🍎",
  "food-snack": "🍪",
  "food-icecream": "🍨",
};

export function brandClass(storeId: StoreKey) {
  return storeId === "mcdonald" ? "mcdonald-mark" : storeId === "subway" ? "subway-mark" : "starbucks-mark";
}

export function BrandMark({ storeId }: { storeId: StoreKey }) {
  return <span className={`brand-mark ${brandClass(storeId)}`} aria-hidden="true">{STORE_MARKS[storeId]}</span>;
}

function MenuImage({ menu }: { menu: CatalogMenuSummary }) {
  const [failed, setFailed] = useState(false);
  if (failed || !menu.source.imageUrl) {
    return <span className={`menu-visual menu-placeholder ${brandClass(menu.storeId)}`} aria-label="메뉴 이미지 대체 표시">{STORE_MARKS[menu.storeId]}</span>;
  }
  return (
    <span className="menu-visual">
      {/* eslint-disable-next-line @next/next/no-img-element -- Official product URLs are runtime catalog data from three changing hosts. */}
      <img
        src={menu.source.imageUrl.replaceAll("&amp;", "&")}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

export function MenuCatalog({
  step,
  stores,
  activeStore,
  activeCategory,
  menus,
  selectedIds,
  savedCounts,
  loading,
  error,
  onRetry,
  onChooseStore,
  onChooseCategory,
  onToggleMenu,
}: {
  step: CatalogStep;
  stores: readonly StoreCatalog[];
  activeStore?: StoreCatalog;
  activeCategory?: Category;
  menus: readonly CatalogMenuSummary[];
  selectedIds: readonly string[];
  savedCounts: Readonly<Partial<Record<StoreKey, number>>>;
  loading: boolean;
  error: string;
  onRetry(): void;
  onChooseStore(storeId: StoreKey): void;
  onChooseCategory(categoryId: string): void;
  onToggleMenu(menuId: string): void;
}) {
  if (loading) {
    return <div className="catalog-state" role="status"><span className="catalog-spinner" /><strong>실제 메뉴를 불러오는 중이에요</strong><p>세 매장의 최신 스냅샷을 준비하고 있어요.</p></div>;
  }
  if (error) {
    return <div className="catalog-state error" role="alert"><strong>메뉴를 불러오지 못했어요</strong><p>{error}</p><button type="button" onClick={onRetry}>다시 시도</button></div>;
  }
  if (step === "store") {
    return (
      <div className="choice-list store-choice-list">
        {stores.map((store) => (
          <button className="store-choice" type="button" key={store.id} onClick={() => onChooseStore(store.id)}>
            <BrandMark storeId={store.id} />
            <span><strong>{store.name}</strong><small>{savedCounts[store.id] ? `${savedCounts[store.id]}개 저장됨` : "처음 만들기"}</small></span>
            <span className="choice-arrow">›</span>
          </button>
        ))}
      </div>
    );
  }
  if (step === "category") {
    return (
      <div className="category-grid">
        {(activeStore?.categories ?? []).map((category) => {
          const count = menus.filter((menu) => menu.categoryId === category.id).length;
          return (
            <button className="category-choice" type="button" key={category.id} onClick={() => onChooseCategory(category.id)}>
              <span>{CATEGORY_ICONS[category.id] ?? "🍽️"}</span>
              <strong>{category.name}</strong>
              <small>{count}개 메뉴</small>
            </button>
          );
        })}
      </div>
    );
  }
  const categoryMenus = menus.filter((menu) => menu.categoryId === activeCategory?.id);
  return categoryMenus.length ? (
    <div className="menu-grid">
      {categoryMenus.map((menu) => {
        const selected = selectedIds.includes(menu.id);
        return (
          <button
            type="button"
            className={`menu-card ${selected ? "selected" : ""}`}
            key={menu.id}
            onClick={() => onToggleMenu(menu.id)}
            aria-pressed={selected}
          >
            <MenuImage menu={menu} />
            <span className="menu-text">
              <strong>{menu.name}</strong>
              {menu.variant && <small className="variant-label">{menu.variant.label}</small>}
              <small>{menu.price.amount.toLocaleString("ko-KR")}원 · {menu.price.type === "estimated" ? "예상 가격" : "공식 확인 가격"}</small>
            </span>
            <span className="check-mark" aria-hidden="true">✓</span>
          </button>
        );
      })}
    </div>
  ) : <div className="catalog-state"><strong>이 종류에는 표시할 메뉴가 없어요</strong><p>다른 카테고리를 골라주세요.</p></div>;
}
