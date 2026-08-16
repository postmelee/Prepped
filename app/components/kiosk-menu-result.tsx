import { useState } from "react";

import type { CatalogMenuDetail, StoreKey } from "../../shared/catalog/types.ts";
import type { KioskCatalogResolution } from "../lib/catalog/resolve.ts";
import { KIOSK_STORE_NAMES, kioskBrandClass } from "./kiosk-store-selector.tsx";

function KioskMenuImage({ menu }: { menu: CatalogMenuDetail }) {
  const [failed, setFailed] = useState(false);
  if (failed || !menu.source.imageUrl) {
    return <span className={`kiosk-menu-image kiosk-menu-placeholder ${kioskBrandClass(menu.storeId)}`} aria-label="메뉴 이미지 대체 표시">{menu.storeId === "starbucks" ? "★" : menu.storeId === "subway" ? "S" : "M"}</span>;
  }
  return (
    <span className="kiosk-menu-image">
      {/* eslint-disable-next-line @next/next/no-img-element -- The catalog supplies changing official product hosts at runtime. */}
      <img src={menu.source.imageUrl.replaceAll("&amp;", "&")} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
    </span>
  );
}

export function KioskMenuResult({
  storeId,
  status,
  result,
  error,
  onRetry,
}: {
  storeId: StoreKey;
  status: "idle" | "loading" | "success" | "error";
  result: KioskCatalogResolution | null;
  error: string;
  onRetry(): void;
}) {
  if (status === "loading") {
    return <div className="kiosk-result-state" role="status"><span className="catalog-spinner" /><strong>{KIOSK_STORE_NAMES[storeId]} 메뉴를 확인하는 중입니다</strong></div>;
  }
  if (status === "error") {
    return <div className="kiosk-result-state error" role="alert"><strong>메뉴를 불러오지 못했습니다</strong><p>{error}</p><button type="button" onClick={onRetry}>다시 확인</button></div>;
  }
  if (!result) return null;
  return (
    <div className="kiosk-resolved">
      <div className="parsed-store-head"><span className={`mini-brand ${kioskBrandClass(storeId)}`}>{storeId === "starbucks" ? "★" : storeId === "subway" ? "S" : "M"}</span><strong>{KIOSK_STORE_NAMES[storeId]} 메뉴 {result.menus.length}개</strong></div>
      <div className="kiosk-menu-list">
        {result.menus.map((menu) => (
          <article className="kiosk-menu-row" key={menu.id}>
            <KioskMenuImage menu={menu} />
            <div>
              <h2>{menu.name}{menu.variant ? <small>{menu.variant.label}</small> : null}</h2>
              <strong>{menu.price.amount.toLocaleString("ko-KR")}원 <em>{menu.price.type === "estimated" ? "예상 가격" : "공식 확인 가격"}</em></strong>
              {menu.optionGroups.length > 0 && <p>{menu.optionGroups.map((group) => group.name).join(" · ")} 변경 가능</p>}
            </div>
          </article>
        ))}
      </div>
      {result.unknownMenuIds.length > 0 && (
        <div className="unknown-menu-warning" role="status"><strong>확인하지 못한 메뉴 {result.unknownMenuIds.length}개</strong><span>{result.unknownMenuIds.join(", ")}</span></div>
      )}
      {result.rejectedTokens.length > 0 && <div className="unknown-menu-warning">안전하지 않은 ID는 제외했습니다.</div>}
    </div>
  );
}
