"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

import { MenuCatalog, type CatalogStep, BrandMark } from "./components/menu-catalog.tsx";
import { StoreSettings } from "./components/store-settings.tsx";
import { loadCatalog, resolveCatalogMenus, type CatalogBundle } from "./lib/catalog/client.ts";
import {
  LEGACY_MENU_LABELS,
  createDefaultMenuSettings,
  readMenuSettings,
  updateStoreSetting,
  writeMenuSettings,
  type MenuSettings,
} from "./lib/catalog/storage.ts";
import { serializeQrPayload } from "../shared/qr/payload.ts";
import { STORE_KEYS, type CatalogMenuDetail, type CatalogMenuSummary, type StoreKey } from "../shared/catalog/types.ts";

type AppTab = "qr" | "create" | "settings";
type SavedViewTab = Exclude<AppTab, "create">;

function formatPrice(price: number) {
  return `${price.toLocaleString("ko-KR")}원`;
}

function sameIds(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

export default function Home() {
  const [tab, setTab] = useState<AppTab>("qr");
  const [step, setStep] = useState<CatalogStep>("store");
  const [catalog, setCatalog] = useState<CatalogBundle | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [settings, setSettings] = useState<MenuSettings>(createDefaultMenuSettings);
  const [activeStoreId, setActiveStoreId] = useState<StoreKey | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [originalIds, setOriginalIds] = useState<string[]>([]);
  const [qrUrl, setQrUrl] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [cartDetails, setCartDetails] = useState<ReadonlyMap<string, CatalogMenuDetail>>(new Map());
  const [detailLoading, setDetailLoading] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [selectionWarning, setSelectionWarning] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [editOriginTab, setEditOriginTab] = useState<SavedViewTab>("settings");
  const [pendingLeaveTarget, setPendingLeaveTarget] = useState<SavedViewTab | null>(null);
  const [directEdit, setDirectEdit] = useState(false);

  const refreshCatalog = useCallback(() => {
    setCatalogLoading(true);
    setCatalogError("");
    loadCatalog()
      .then(setCatalog)
      .catch((error: unknown) => setCatalogError(error instanceof Error ? error.message : "메뉴를 불러오지 못했습니다."))
      .finally(() => setCatalogLoading(false));
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- Catalog and browser storage are client-only boundaries. */
  useEffect(() => {
    refreshCatalog();
    try {
      setSettings(readMenuSettings(window.localStorage));
    } finally {
      setHydrated(true);
    }
  }, [refreshCatalog]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return;
    try {
      writeMenuSettings(window.localStorage, settings);
    } catch {
      // The app remains useful in private browsing even when persistence is unavailable.
    }
  }, [settings, hydrated]);

  const enabledStoreIds = useMemo(
    () => STORE_KEYS.filter((storeId) => settings.stores[storeId].enabled && settings.stores[storeId].menuIds.length > 0),
    [settings],
  );
  const qrPayload = useMemo(() => serializeQrPayload(
    Object.fromEntries(STORE_KEYS.map((storeId) => [storeId, settings.stores[storeId].menuIds])),
    enabledStoreIds,
  ), [settings, enabledStoreIds]);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(qrPayload, {
      width: 720,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#111111", light: "#FFFFFF" },
    }).then((url) => active && setQrUrl(url));
    return () => {
      active = false;
    };
  }, [qrPayload]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  const menusById = useMemo(() => new Map(
    STORE_KEYS.flatMap((storeId) => (catalog?.menusByStore[storeId] ?? []).map((menu) => [menu.id, menu] as const)),
  ), [catalog]);
  const activeStore = catalog?.stores.find((store) => store.id === activeStoreId);
  const activeMenus = activeStoreId ? catalog?.menusByStore[activeStoreId] ?? [] : [];
  const activeCategory = activeStore?.categories.find((category) => category.id === activeCategoryId);
  const selectedItems = selectedIds.map((menuId) => {
    const menu = menusById.get(menuId);
    if (menu) return menu;
    const legacy = LEGACY_MENU_LABELS[menuId];
    if (!legacy || !activeStoreId) return undefined;
    return {
      id: menuId,
      storeId: activeStoreId,
      categoryId: "legacy",
      name: legacy.name,
      price: { amount: legacy.price, currency: "KRW", type: "estimated" },
      source: {
        provider: activeStoreId,
        productId: menuId,
        productUrl: "https://github.com/postmelee/Prepped",
        imageUsage: "placeholder",
        collectedAt: "2026-08-16T07:00:00Z",
      },
      isAvailable: false,
    } satisfies CatalogMenuSummary;
  }).filter((menu): menu is CatalogMenuSummary => Boolean(menu));
  const selectedTotal = selectedItems.reduce((sum, item) => sum + item.price.amount, 0);
  const savedCounts = Object.fromEntries(STORE_KEYS.map((storeId) => [storeId, settings.stores[storeId].menuIds.length]));
  const configuredStoreCount = STORE_KEYS.filter((storeId) => settings.stores[storeId].menuIds.length > 0).length;
  const includedMenuCount = enabledStoreIds.reduce((sum, storeId) => sum + settings.stores[storeId].menuIds.length, 0);
  const draftDirty = !sameIds(selectedIds, originalIds);

  function startCreate() {
    setActiveStoreId(null);
    setActiveCategoryId(null);
    setSelectedIds([]);
    setOriginalIds([]);
    setDirectEdit(false);
    setStep("store");
    setTab("create");
  }

  function chooseStore(storeId: StoreKey, direct = false) {
    const saved = [...settings.stores[storeId].menuIds];
    setActiveStoreId(storeId);
    setActiveCategoryId(null);
    setSelectedIds(saved);
    setOriginalIds(saved);
    setDirectEdit(direct);
    setStep("category");
  }

  function editSavedStore(storeId: StoreKey, origin: SavedViewTab = tab === "qr" ? "qr" : "settings") {
    setEditOriginTab(origin);
    chooseStore(storeId, true);
    setTab("create");
  }

  function requestTabChange(nextTab: SavedViewTab) {
    if (tab === nextTab) return;
    if (tab === "create" && activeStoreId && draftDirty) {
      setPendingLeaveTarget(nextTab);
      return;
    }
    setTab(nextTab);
  }

  function handleCreateBack() {
    if (step === "menu") {
      setStep("category");
      return;
    }
    if (activeStoreId && draftDirty) {
      setPendingLeaveTarget(directEdit ? editOriginTab : "qr");
      return;
    }
    if (directEdit) {
      setTab(editOriginTab);
      setStep("store");
      return;
    }
    setActiveStoreId(null);
    setStep("store");
  }

  function discardDraftAndLeave() {
    const nextTab = pendingLeaveTarget ?? editOriginTab;
    setSelectedIds(originalIds);
    setPendingLeaveTarget(null);
    setActiveStoreId(null);
    setActiveCategoryId(null);
    setStep("store");
    setTab(nextTab);
  }

  function persistActiveStore(nextTab: SavedViewTab) {
    if (!activeStoreId) return;
    setSettings((current) => updateStoreSetting(current, activeStoreId, {
      enabled: selectedIds.length > 0,
      menuIds: selectedIds,
    }));
    setOriginalIds(selectedIds);
    setPendingLeaveTarget(null);
    setCartOpen(false);
    setStep("store");
    setTab(nextTab);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2600);
  }

  function toggleMenu(menuId: string) {
    setSelectionWarning("");
    setSelectedIds((current) => {
      if (current.includes(menuId)) return current.filter((selectedId) => selectedId !== menuId);
      if (current.length >= 20) {
        setSelectionWarning("한 매장에는 QR 용량을 위해 메뉴를 20개까지 저장할 수 있어요.");
        return current;
      }
      return [...current, menuId];
    });
  }

  async function openSelectedMenus() {
    setCartOpen(true);
    setCartDetails(new Map());
    if (!activeStoreId || selectedIds.length === 0) return;
    setDetailLoading(true);
    try {
      const result = await resolveCatalogMenus(activeStoreId, selectedIds);
      setCartDetails(new Map(result.menus.map((menu) => [menu.id, menu])));
    } catch {
      // The selected summary and QR IDs remain usable if detail loading fails.
    } finally {
      setDetailLoading(false);
    }
  }

  function toggleStore(storeId: StoreKey) {
    const current = settings.stores[storeId];
    setSettings((value) => updateStoreSetting(value, storeId, {
      ...current,
      enabled: !current.enabled,
    }));
  }

  return (
    <main className="mobile-shell">
      <section className="phone-app" aria-label="Prepped 메뉴 QR 앱">
        {tab === "qr" ? (
          <div className="screen qr-screen">
            <header className="screen-header"><div><span className="eyebrow">Prepped</span><h1>내 메뉴 QR</h1></div><span className="catalog-version">{catalog?.catalogVersion ?? "메뉴 준비 중"}</span></header>
            <div className="qr-card">
              <div className="qr-frame" aria-label={`QR 데이터: ${qrPayload}`}>
                {qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- The QR encoder returns a runtime data URL.
                  <img src={qrUrl} alt="내 메뉴가 저장된 QR 코드" />
                ) : <div className="qr-loading" />}
                <span className="qr-corner corner-one" /><span className="qr-corner corner-two" />
                <span className="qr-corner corner-three" /><span className="qr-corner corner-four" />
              </div>
              <strong>키오스크 카메라에 보여주세요</strong>
              <p>{includedMenuCount ? `${enabledStoreIds.length}개 매장 · ${includedMenuCount}개 메뉴가 담겨 있어요` : "QR에 포함된 메뉴가 없어요"}</p>
            </div>
            <section className="qr-info" aria-labelledby="qr-info-title">
              <div className="section-title-row"><h2 id="qr-info-title">QR 정보</h2><button className="text-button" type="button" onClick={startCreate}>매장 추가</button></div>
              <div className="qr-store-list">
                {(catalog?.stores ?? []).map((store) => {
                  const setting = settings.stores[store.id];
                  const names = setting.menuIds.map((id) => menusById.get(id)?.name ?? LEGACY_MENU_LABELS[id]?.name).filter(Boolean);
                  return (
                    <div className={`store-toggle ${setting.enabled ? "enabled" : ""}`} key={store.id}>
                      <BrandMark storeId={store.id} />
                      <button type="button" className="store-copy" onClick={() => editSavedStore(store.id, "qr")}>
                        <strong>{store.name}</strong><span>{names.join(" · ") || "메뉴 없음 · 눌러서 설정"}</span>
                      </button>
                      <button className="toggle" role="switch" aria-checked={setting.enabled} aria-label={`${store.name} QR 포함`} onClick={() => toggleStore(store.id)} disabled={!setting.menuIds.length} type="button"><span /></button>
                    </div>
                  );
                })}
                {catalogLoading && <div className="catalog-inline-state">매장 정보를 불러오는 중이에요…</div>}
              </div>
            </section>
          </div>
        ) : tab === "settings" ? (
          <div className="screen settings-screen">
            <header className="screen-header settings-header">
              <div><span className="eyebrow">Prepped</span><h1>내 설정 메뉴</h1></div>
              <span className="settings-count" aria-label={`설정된 매장 ${configuredStoreCount}개`}>{configuredStoreCount}개 매장</span>
            </header>
            {catalog ? (
              <StoreSettings stores={catalog.stores} settings={settings} menusById={menusById} onEdit={(storeId) => editSavedStore(storeId, "settings")} onToggle={toggleStore} />
            ) : <div className="catalog-state"><strong>{catalogError || "내 설정을 준비하고 있어요"}</strong><p>저장된 값은 이 기기에 안전하게 남아 있어요.</p>{catalogError && <button type="button" onClick={refreshCatalog}>다시 시도</button>}</div>}
            <p className="price-footnote">* 예상 가격은 실제 매장·배달 가격과 다를 수 있어요.</p>
          </div>
        ) : (
          <div className="screen create-screen">
            <header className="create-header">
              <div><span className="eyebrow">자주 먹는 메뉴</span><h1>{step === "store" ? "매장을 골라주세요" : step === "category" ? `${activeStore?.shortName ?? "매장"}에서 종류를 골라주세요` : `${activeCategory?.name ?? "선택한"} 메뉴`}</h1></div>
              {step !== "store" && <button className="back-button" type="button" aria-label="이전 단계" onClick={handleCreateBack}>‹</button>}
            </header>
            <div className="progress-track" aria-label="메뉴 선택 단계"><span className="active" /><span className={step !== "store" ? "active" : ""} /><span className={step === "menu" ? "active" : ""} /></div>
            <MenuCatalog
              step={step}
              stores={catalog?.stores ?? []}
              activeStore={activeStore}
              activeCategory={activeCategory}
              menus={activeMenus}
              selectedIds={selectedIds}
              savedCounts={savedCounts}
              loading={catalogLoading}
              error={catalogError}
              onRetry={refreshCatalog}
              onChooseStore={(storeId) => chooseStore(storeId)}
              onChooseCategory={(categoryId) => { setActiveCategoryId(categoryId); setStep("menu"); }}
              onToggleMenu={toggleMenu}
            />
            {selectionWarning && <p className="selection-warning" role="status">{selectionWarning}</p>}
            {activeStoreId && selectedIds.length > 0 && (
              <button className="selected-bar" type="button" onClick={openSelectedMenus}>
                <span className="count-dot">{selectedIds.length}</span><strong>선택 메뉴</strong><span>{formatPrice(selectedTotal)} · 목록 보기</span>
              </button>
            )}
          </div>
        )}

        <nav className="bottom-nav" aria-label="주요 메뉴">
          <button className={tab === "qr" ? "active" : ""} type="button" onClick={() => requestTabChange("qr")} aria-current={tab === "qr" ? "page" : undefined}><span className="nav-icon qr-icon"><i /><i /><i /></span><strong>내 QR</strong></button>
          <button className={tab === "create" ? "active" : ""} type="button" onClick={() => { if (tab !== "create") startCreate(); }} aria-current={tab === "create" ? "page" : undefined}><span className="nav-icon plus-icon">＋</span><strong>메뉴 만들기</strong></button>
          <button className={tab === "settings" ? "active" : ""} type="button" onClick={() => requestTabChange("settings")} aria-current={tab === "settings" ? "page" : undefined}><span className="nav-icon settings-icon"><i /><i /><i /></span><strong>내 설정</strong></button>
        </nav>

        {cartOpen && (
          <div className="sheet-backdrop">
            <button className="sheet-backdrop-dismiss" type="button" aria-label="선택한 메뉴 닫기" onClick={() => setCartOpen(false)} />
            <section className="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="selected-title">
              <div className="sheet-handle" />
              <div className="sheet-heading"><div><span className="eyebrow">{activeStore?.name}</span><h2 id="selected-title">선택한 메뉴</h2></div><button type="button" aria-label="닫기" onClick={() => setCartOpen(false)}>×</button></div>
              <div className="cart-items">
                {selectedItems.map((item) => {
                  const detail = cartDetails.get(item.id);
                  return (
                    <div className="cart-item" key={item.id}>
                      <span className="cart-thumb">🍽️</span>
                      <span><strong>{item.name}{item.variant ? ` · ${item.variant.label}` : ""}</strong><small>{formatPrice(item.price.amount)} · {item.price.type === "estimated" ? "예상 가격" : "공식 확인 가격"}</small>{detail?.optionGroups.length ? <em>{detail.optionGroups.map((group) => group.name).join(" · ")} 변경 가능</em> : null}</span>
                      <button type="button" aria-label={`${item.name} 빼기`} onClick={() => toggleMenu(item.id)}>빼기</button>
                    </div>
                  );
                })}
                {detailLoading && <p className="detail-loading" role="status">커스텀 가능 옵션을 확인하는 중이에요…</p>}
              </div>
              <p className="customization-note">QR에는 메뉴 ID와 기본 옵션이 저장돼요. 표시된 커스텀은 키오스크에서 바꿀 수 있어요.</p>
              <div className="sheet-total"><span>예상 합계</span><strong>{formatPrice(selectedTotal)}</strong></div>
              <button className="primary-button" type="button" onClick={() => persistActiveStore("qr")}>이 메뉴로 저장하기</button>
            </section>
          </div>
        )}

        {pendingLeaveTarget && (
          <div className="leave-dialog-backdrop">
            <section className="leave-dialog" role="alertdialog" aria-modal="true" aria-labelledby="leave-dialog-title" aria-describedby="leave-dialog-description">
              <span className="eyebrow">메뉴 변경 중</span><h2 id="leave-dialog-title">변경한 메뉴를 저장할까요?</h2><p id="leave-dialog-description">저장하지 않으면 기존 메뉴가 그대로 유지돼요.</p>
              <div className="leave-dialog-actions">
                {/* eslint-disable-next-line jsx-a11y/no-autofocus -- The safe discard action receives initial focus. */}
                <button className="discard-draft-button" type="button" onClick={discardDraftAndLeave} autoFocus>저장하지 않음</button>
                <button className="save-draft-button" type="button" onClick={() => persistActiveStore(pendingLeaveTarget)}>저장하기</button>
              </div>
            </section>
          </div>
        )}
        {savedNotice && <div className="toast" role="status">모든 활성 매장의 QR이 새 메뉴로 바뀌었어요</div>}
      </section>
    </main>
  );
}
