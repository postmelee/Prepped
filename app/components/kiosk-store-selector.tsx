import type { StoreKey } from "../../shared/catalog/types.ts";

const STORES: readonly { id: StoreKey; name: string; mark: string; description: string }[] = [
  { id: "mcdonald", name: "맥도날드", mark: "M", description: "버거·사이드·맥카페" },
  { id: "subway", name: "써브웨이", mark: "S", description: "샌드위치·샐러드" },
  { id: "starbucks", name: "스타벅스", mark: "★", description: "음료·푸드" },
];

export const KIOSK_STORE_NAMES: Readonly<Record<StoreKey, string>> = Object.fromEntries(
  STORES.map((store) => [store.id, store.name]),
) as Record<StoreKey, string>;

export function kioskBrandClass(storeId: StoreKey) {
  return storeId === "mcdonald" ? "mcdonald-mark" : storeId === "subway" ? "subway-mark" : "starbucks-mark";
}

export function KioskStoreSelector({ onSelect }: { onSelect(storeId: StoreKey): void }) {
  return (
    <section className="kiosk-store-selector" aria-labelledby="kiosk-store-title">
      <span className="kiosk-step">1단계</span>
      <h1 id="kiosk-store-title">이 키오스크의<br />매장을 골라주세요</h1>
      <p>QR에는 여러 매장 메뉴가 함께 있어도 선택한 매장만 불러옵니다.</p>
      <div className="kiosk-store-grid">
        {STORES.map((store) => (
          <button type="button" key={store.id} onClick={() => onSelect(store.id)}>
            <span className={`kiosk-store-mark ${kioskBrandClass(store.id)}`} aria-hidden="true">{store.mark}</span>
            <span><strong>{store.name}</strong><small>{store.description}</small></span>
            <i aria-hidden="true">›</i>
          </button>
        ))}
      </div>
    </section>
  );
}
