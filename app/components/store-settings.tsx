import type { CatalogMenuSummary, StoreKey } from "../../shared/catalog/types.ts";
import type { StoreCatalog } from "../lib/catalog/client.ts";
import { LEGACY_MENU_LABELS, type MenuSettings } from "../lib/catalog/storage.ts";
import { BrandMark } from "./menu-catalog.tsx";

function formatPrice(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function StoreSettings({
  stores,
  settings,
  menusById,
  onEdit,
  onToggle,
}: {
  stores: readonly StoreCatalog[];
  settings: MenuSettings;
  menusById: ReadonlyMap<string, CatalogMenuSummary>;
  onEdit(storeId: StoreKey): void;
  onToggle(storeId: StoreKey): void;
}) {
  return (
    <div className="settings-store-list">
      {stores.map((store) => {
        const setting = settings.stores[store.id];
        const rows = setting.menuIds.map((menuId) => {
          const menu = menusById.get(menuId);
          return menu
            ? { id: menu.id, name: menu.name, price: menu.price.amount, estimated: menu.price.type === "estimated" }
            : { id: menuId, name: LEGACY_MENU_LABELS[menuId]?.name ?? "현재 카탈로그에서 찾을 수 없는 메뉴", price: LEGACY_MENU_LABELS[menuId]?.price ?? 0, estimated: true };
        });
        const total = rows.reduce((sum, item) => sum + item.price, 0);
        return (
          <section className="settings-store-card" aria-labelledby={`${store.id}-settings-title`} key={store.id}>
            <div className="settings-store-heading">
              <BrandMark storeId={store.id} />
              <div className="settings-store-name">
                <h2 id={`${store.id}-settings-title`}>{store.name}</h2>
                <span>{rows.length ? `${rows.length}개 메뉴` : "설정 없음"}</span>
              </div>
              <button
                type="button"
                className={`qr-status status-button ${setting.enabled ? "included" : "excluded"}`}
                onClick={() => onToggle(store.id)}
                disabled={rows.length === 0}
                aria-label={`${store.name} QR ${setting.enabled ? "제외" : "포함"}`}
              >
                {setting.enabled ? "QR 사용 중" : "QR 제외"}
              </button>
            </div>
            {rows.length ? (
              <ul className="settings-menu-list" aria-label={`${store.name}에 저장한 메뉴`}>
                {rows.map((item) => (
                  <li key={item.id}>
                    <span className="settings-menu-thumb" aria-hidden="true">🍽️</span>
                    <strong>{item.name}</strong>
                    <span>{formatPrice(item.price)}{item.estimated ? "*" : ""}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="settings-empty"><strong>설정된 메뉴가 없어요</strong><span>자주 먹는 메뉴를 담아주세요.</span></div>
            )}
            <div className="settings-store-actions">
              <div><span>예상 합계</span><strong>{formatPrice(total)}</strong></div>
              <button type="button" onClick={() => onEdit(store.id)}>{rows.length ? "메뉴 바꾸기" : "메뉴 담기"}</button>
            </div>
          </section>
        );
      })}
    </div>
  );
}
