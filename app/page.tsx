"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  copyShareText,
  countQrMenus,
  countQrStores,
  createQrShareUrl,
  getStorePayload,
  parseQrPayload,
  readSharedQrPayload,
} from "./lib/qr-share";

type MenuItem = {
  id: number;
  name: string;
  price: number;
  category: "burger" | "side" | "drink";
  icon: string;
  tone: string;
};

type AppTab = "qr" | "create" | "settings";
type SavedViewTab = Exclude<AppTab, "create">;

const MENU_ITEMS: MenuItem[] = [
  { id: 101, name: "빅맥", price: 6300, category: "burger", icon: "🍔", tone: "tomato" },
  { id: 102, name: "불고기 버거", price: 3500, category: "burger", icon: "🍔", tone: "amber" },
  { id: 103, name: "1955 버거", price: 7200, category: "burger", icon: "🍔", tone: "brown" },
  { id: 104, name: "맥스파이시 상하이 버거", price: 6500, category: "burger", icon: "🍔", tone: "red" },
  { id: 201, name: "후렌치 후라이", price: 3000, category: "side", icon: "🍟", tone: "yellow" },
  { id: 202, name: "맥너겟 6조각", price: 4600, category: "side", icon: "◌", tone: "orange" },
  { id: 203, name: "해쉬 브라운", price: 1800, category: "side", icon: "▰", tone: "gold" },
  { id: 301, name: "코카콜라", price: 2600, category: "drink", icon: "🥤", tone: "cola" },
  { id: 302, name: "아메리카노", price: 3300, category: "drink", icon: "☕", tone: "coffee" },
  { id: 303, name: "바닐라 쉐이크", price: 3500, category: "drink", icon: "🥛", tone: "cream" },
];

const CATEGORIES = [
  { id: "burger", name: "버거", icon: "🍔" },
  { id: "side", name: "사이드", icon: "🍟" },
  { id: "drink", name: "음료", icon: "🥤" },
] as const;

const DEFAULT_IDS = [101, 201, 301];
const STORAGE_KEY = "onemeal-menu-v1";

function formatPrice(price: number) {
  return `${price.toLocaleString("ko-KR")}원`;
}

function getItem(id: number) {
  return MENU_ITEMS.find((item) => item.id === id);
}

export default function Home() {
  const [tab, setTab] = useState<AppTab>("qr");
  const [step, setStep] = useState<"store" | "category" | "menu">("store");
  const [category, setCategory] = useState<MenuItem["category"]>("burger");
  const [selectedIds, setSelectedIds] = useState<number[]>(DEFAULT_IDS);
  const [savedIds, setSavedIds] = useState<number[]>(DEFAULT_IDS);
  const [qrUrl, setQrUrl] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [editingSavedStore, setEditingSavedStore] = useState(false);
  const [editOriginTab, setEditOriginTab] = useState<SavedViewTab>("settings");
  const [pendingLeaveTarget, setPendingLeaveTarget] = useState<SavedViewTab | null>(null);
  const [sharedPayload, setSharedPayload] = useState<string | null>(null);
  const [shareQueryError, setShareQueryError] = useState(false);
  const [shareNotice, setShareNotice] = useState<{ message: string; error: boolean } | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect -- Browser storage is only available after the server-rendered page mounts. */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { savedIds?: number[]; storeEnabled?: boolean };
        if (Array.isArray(parsed.savedIds)) {
          setSavedIds(parsed.savedIds);
          setSelectedIds(parsed.savedIds);
        }
      }
    } catch {
      // Keep the useful demo combination if local storage is unavailable.
    }

    const shared = readSharedQrPayload(window.location.search);
    setSharedPayload(shared.payload);
    setShareQueryError(shared.error === "invalid");
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedIds, storeEnabled: true }));
    } catch {
      // The QR remains useful if storage is blocked by the browser.
    }
  }, [savedIds, hydrated]);

  const localQrPayload = useMemo(
    () => (savedIds.length ? `mcdonald={${savedIds.join(",")}}` : "menu={}"),
    [savedIds],
  );
  const qrPayload = sharedPayload ?? localQrPayload;
  const qrGroups = parseQrPayload(qrPayload) ?? [];
  const qrMenuCount = countQrMenus(qrPayload);
  const qrStoreCount = countQrStores(qrPayload);
  const mcdonaldPayload = getStorePayload(qrPayload, "mcdonald");
  const mcdonaldGroup = qrGroups.find((group) => group.store === "mcdonald");

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

  const selectedItems = selectedIds.map(getItem).filter((item): item is MenuItem => Boolean(item));
  const savedItems = savedIds.map(getItem).filter((item): item is MenuItem => Boolean(item));
  const total = selectedItems.reduce((sum, item) => sum + item.price, 0);
  const savedTotal = savedItems.reduce((sum, item) => sum + item.price, 0);
  const menuForCategory = MENU_ITEMS.filter((item) => item.category === category);
  const mcdonaldQrNames = (mcdonaldGroup?.menuIds ?? []).map(
    (menuId) => getItem(Number(menuId))?.name ?? `메뉴 ${menuId}`,
  );

  function fallbackCopy(text: string) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  }

  async function copyQrLink(payload: string, targetName: string) {
    try {
      const shareUrl = createQrShareUrl(window.location.origin, payload);
      await copyShareText(shareUrl, {
        writeClipboard: navigator.clipboard?.writeText.bind(navigator.clipboard),
        fallbackCopy,
      });
      setShareNotice({ message: `${targetName} 링크를 복사했어요`, error: false });
    } catch {
      setShareNotice({ message: "링크를 복사하지 못했어요. 다시 눌러주세요", error: true });
    }
    window.setTimeout(() => setShareNotice(null), 2800);
  }

  function returnToLocalQr() {
    const url = new URL(window.location.href);
    url.searchParams.delete("qr");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    setSharedPayload(null);
    setShareQueryError(false);
  }

  function startCreate() {
    setSelectedIds(savedIds);
    setEditingSavedStore(false);
    setStep("store");
    setTab("create");
  }

  function editSavedStore() {
    setSelectedIds([]);
    setEditOriginTab(tab === "qr" ? "qr" : "settings");
    setEditingSavedStore(true);
    setStep("category");
    setTab("create");
  }

  function requestTabChange(nextTab: SavedViewTab) {
    if (tab === nextTab) return;
    if (tab === "create" && editingSavedStore) {
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
    if (editingSavedStore) {
      setPendingLeaveTarget(editOriginTab);
      return;
    }
    setStep("store");
  }

  function discardDraftAndLeave() {
    const nextTab = pendingLeaveTarget ?? editOriginTab;
    setSelectedIds(savedIds);
    setEditingSavedStore(false);
    setPendingLeaveTarget(null);
    setStep("store");
    setTab(nextTab);
  }

  function saveDraftAndLeave() {
    if (!selectedIds.length) return;
    const nextTab = pendingLeaveTarget ?? editOriginTab;
    setSavedIds(selectedIds);
    setEditingSavedStore(false);
    setPendingLeaveTarget(null);
    setStep("store");
    setTab(nextTab);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2600);
  }

  function toggleMenu(id: number) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((menuId) => menuId !== id) : [...current, id],
    );
  }

  function saveMenu() {
    setSavedIds(selectedIds);
    setEditingSavedStore(false);
    setPendingLeaveTarget(null);
    setCartOpen(false);
    setSavedNotice(true);
    setTab("qr");
    window.setTimeout(() => setSavedNotice(false), 2600);
  }

  return (
    <main className="mobile-shell">
      <section className="phone-app" aria-label="Prepped 메뉴 QR 앱">
        {tab === "qr" ? (
          <div className="screen qr-screen">
            <header className="screen-header">
              <span className="eyebrow">Prepped</span>
              <h1>내 메뉴 QR</h1>
            </header>

            {sharedPayload && (
              <div className="shared-qr-banner" role="status">
                <div>
                  <strong>공유받은 QR이에요</strong>
                  <span>내 설정 메뉴는 바뀌지 않아요</span>
                </div>
                <button type="button" onClick={returnToLocalQr}>내 QR 보기</button>
              </div>
            )}

            {shareQueryError && (
              <div className="shared-qr-banner error" role="alert">
                <div>
                  <strong>링크를 읽을 수 없어요</strong>
                  <span>안전하게 내 QR을 보여드려요</span>
                </div>
              </div>
            )}

            <div className="qr-card">
              <div className="qr-frame" aria-label={`QR 데이터: ${qrPayload}`}>
                {qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- The QR encoder returns a runtime data URL.
                  <img src={qrUrl} alt="내 메뉴가 저장된 QR 코드" />
                ) : (
                  <div className="qr-loading" />
                )}
                <span className="qr-corner corner-one" />
                <span className="qr-corner corner-two" />
                <span className="qr-corner corner-three" />
                <span className="qr-corner corner-four" />
              </div>
              <strong>키오스크 카메라에 보여주세요</strong>
              <p>
                {qrStoreCount > 1
                  ? `${qrStoreCount}개 매장 · ${qrMenuCount}개 메뉴가 담겨 있어요`
                  : `${qrMenuCount}개 메뉴가 담겨 있어요`}
              </p>
              <button
                className="share-all-button"
                type="button"
                onClick={() => copyQrLink(qrPayload, "전체 메뉴")}
                disabled={qrMenuCount === 0}
                aria-label="모든 매장의 메뉴 QR 링크 복사"
              >
                <span aria-hidden="true">↗</span>
                전체 링크 복사
              </button>
            </div>

            <section className="qr-info" aria-labelledby="qr-info-title">
              <div className="section-title-row">
                <h2 id="qr-info-title">QR 정보</h2>
                <button className="text-button" type="button" onClick={editSavedStore}>메뉴 바꾸기</button>
              </div>
              <div className="store-share-row">
                <div className="brand-mark mcdonald-mark" aria-hidden="true">M</div>
                <div className="store-copy">
                  <strong>맥도날드</strong>
                  <span>{mcdonaldQrNames.join(" · ") || "메뉴 없음"}</span>
                </div>
                <button
                  className="store-share-button"
                  aria-label="맥도날드 메뉴 QR 링크 복사"
                  onClick={() => mcdonaldPayload && copyQrLink(mcdonaldPayload, "맥도날드 메뉴")}
                  disabled={!mcdonaldPayload || !qrGroups.find((group) => group.store === "mcdonald")?.menuIds.length}
                  type="button"
                >
                  <span aria-hidden="true">↗</span>
                  공유
                </button>
              </div>
            </section>
          </div>
        ) : tab === "settings" ? (
          <div className="screen settings-screen">
            <header className="screen-header settings-header">
              <div>
                <span className="eyebrow">Prepped</span>
                <h1>내 설정 메뉴</h1>
              </div>
              <span className="settings-count" aria-label={`설정된 매장 1개, 메뉴 ${savedItems.length}개`}>
                1개 매장
              </span>
            </header>

            <div className="settings-store-list">
              <section className="settings-store-card" aria-labelledby="mcdonald-settings-title">
                <div className="settings-store-heading">
                  <div className="brand-mark mcdonald-mark" aria-hidden="true">M</div>
                  <div className="settings-store-name">
                    <h2 id="mcdonald-settings-title">맥도날드</h2>
                    <span>{savedItems.length}개 메뉴</span>
                  </div>
                  <span className="qr-status included">QR 사용 중</span>
                </div>

                {savedItems.length ? (
                  <ul className="settings-menu-list" aria-label="맥도날드에 저장한 메뉴">
                    {savedItems.map((item) => (
                      <li key={item.id}>
                        <span className={`settings-menu-thumb ${item.tone}`} aria-hidden="true">{item.icon}</span>
                        <strong>{item.name}</strong>
                        <span>{formatPrice(item.price)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="settings-empty">
                    <strong>설정된 메뉴가 없어요</strong>
                    <span>자주 먹는 메뉴를 담아주세요</span>
                  </div>
                )}

                <div className="settings-store-actions">
                  <div>
                    <span>합계</span>
                    <strong>{formatPrice(savedTotal)}</strong>
                  </div>
                  <button type="button" onClick={editSavedStore}>
                    {savedItems.length ? "메뉴 바꾸기" : "메뉴 담기"}
                  </button>
                </div>
              </section>

              <section className="settings-store-card unavailable" aria-labelledby="subway-settings-title">
                <div className="settings-store-heading">
                  <div className="brand-mark subway-mark" aria-hidden="true">S</div>
                  <div className="settings-store-name">
                    <h2 id="subway-settings-title">서브웨이</h2>
                    <span>설정 없음</span>
                  </div>
                  <span className="coming-badge">준비 중</span>
                </div>
                <div className="settings-empty compact">
                  <strong>아직 선택할 수 없어요</strong>
                  <span>메뉴가 준비되면 알려드릴게요</span>
                </div>
              </section>
            </div>
          </div>
        ) : (
          <div className="screen create-screen">
            <header className="create-header">
              <div>
                <span className="eyebrow">자주 먹는 메뉴</span>
                <h1>
                  {step === "store" && "매장을 골라주세요"}
                  {step === "category" && "종류를 골라주세요"}
                  {step === "menu" && `${CATEGORIES.find((item) => item.id === category)?.name} 메뉴`}
                </h1>
              </div>
              {step !== "store" && (
                <button
                  className="back-button"
                  type="button"
                  aria-label="이전 단계"
                  onClick={handleCreateBack}
                >
                  ‹
                </button>
              )}
            </header>

            <div className="progress-track" aria-label="메뉴 선택 단계">
              <span className="active" />
              <span className={step !== "store" ? "active" : ""} />
              <span className={step === "menu" ? "active" : ""} />
            </div>

            {step === "store" && (
              <div className="choice-list store-choice-list">
                <button className="store-choice" type="button" onClick={() => setStep("category")}>
                  <span className="brand-mark mcdonald-mark">M</span>
                  <span><strong>맥도날드</strong><small>{savedIds.length ? `${savedIds.length}개 저장됨` : "처음 만들기"}</small></span>
                  <span className="choice-arrow">›</span>
                </button>
                <button className="store-choice unavailable" type="button" disabled>
                  <span className="brand-mark subway-mark">S</span>
                  <span><strong>서브웨이</strong><small>준비 중</small></span>
                </button>
              </div>
            )}

            {step === "category" && (
              <div className="category-grid">
                {CATEGORIES.map((item) => (
                  <button
                    className="category-choice"
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setCategory(item.id);
                      setStep("menu");
                    }}
                  >
                    <span>{item.icon}</span>
                    <strong>{item.name}</strong>
                    <small>{MENU_ITEMS.filter((menu) => menu.category === item.id).length}개 메뉴</small>
                  </button>
                ))}
              </div>
            )}

            {step === "menu" && (
              <div className="menu-grid">
                {menuForCategory.map((item) => {
                  const selected = selectedIds.includes(item.id);
                  return (
                    <button
                      type="button"
                      className={`menu-card ${selected ? "selected" : ""}`}
                      key={item.id}
                      onClick={() => toggleMenu(item.id)}
                      aria-pressed={selected}
                    >
                      <span className={`menu-visual ${item.tone}`}>{item.icon}</span>
                      <span className="menu-text"><strong>{item.name}</strong><small>{formatPrice(item.price)}</small></span>
                      <span className="check-mark" aria-hidden="true">✓</span>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedIds.length > 0 && (
              <button className="selected-bar" type="button" onClick={() => setCartOpen(true)}>
                <span className="count-dot">{selectedIds.length}</span>
                <strong>선택 메뉴</strong>
                <span>{formatPrice(total)} · 목록 보기</span>
              </button>
            )}
          </div>
        )}

        <nav className="bottom-nav" aria-label="주요 메뉴">
          <button
            className={tab === "qr" ? "active" : ""}
            type="button"
            onClick={() => requestTabChange("qr")}
            aria-current={tab === "qr" ? "page" : undefined}
          >
            <span className="nav-icon qr-icon"><i /><i /><i /></span>
            <strong>내 QR</strong>
          </button>
          <button
            className={tab === "create" ? "active" : ""}
            type="button"
            onClick={() => {
              if (tab !== "create") startCreate();
            }}
            aria-current={tab === "create" ? "page" : undefined}
          >
            <span className="nav-icon plus-icon">＋</span>
            <strong>메뉴 만들기</strong>
          </button>
          <button
            className={tab === "settings" ? "active" : ""}
            type="button"
            onClick={() => requestTabChange("settings")}
            aria-current={tab === "settings" ? "page" : undefined}
          >
            <span className="nav-icon settings-icon"><i /><i /><i /></span>
            <strong>내 설정</strong>
          </button>
        </nav>

        {cartOpen && (
          <div className="sheet-backdrop">
            <button
              className="sheet-backdrop-dismiss"
              type="button"
              aria-label="선택한 메뉴 닫기"
              onClick={() => setCartOpen(false)}
            />
            <section className="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="selected-title">
              <div className="sheet-handle" />
              <div className="sheet-heading">
                <div><span className="eyebrow">맥도날드</span><h2 id="selected-title">선택한 메뉴</h2></div>
                <button type="button" aria-label="닫기" onClick={() => setCartOpen(false)}>×</button>
              </div>
              <div className="cart-items">
                {selectedItems.map((item) => (
                  <div className="cart-item" key={item.id}>
                    <span className={`cart-thumb ${item.tone}`}>{item.icon}</span>
                    <span><strong>{item.name}</strong><small>{formatPrice(item.price)}</small></span>
                    <button type="button" aria-label={`${item.name} 빼기`} onClick={() => toggleMenu(item.id)}>빼기</button>
                  </div>
                ))}
              </div>
              <div className="sheet-total"><span>합계</span><strong>{formatPrice(total)}</strong></div>
              <button className="primary-button" type="button" onClick={saveMenu}>이 메뉴로 저장하기</button>
            </section>
          </div>
        )}

        {pendingLeaveTarget && (
          <div className="leave-dialog-backdrop">
            <section
              className="leave-dialog"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="leave-dialog-title"
              aria-describedby="leave-dialog-description"
            >
              <span className="eyebrow">메뉴 변경 중</span>
              <h2 id="leave-dialog-title">변경한 메뉴를 저장할까요?</h2>
              <p id="leave-dialog-description">저장하지 않으면 기존 메뉴가 그대로 유지돼요.</p>
              <div className="leave-dialog-actions">
                {/* eslint-disable-next-line jsx-a11y/no-autofocus -- The safe discard action is intentionally the default. */}
                <button className="discard-draft-button" type="button" onClick={discardDraftAndLeave} autoFocus>
                  저장하지 않음
                </button>
                <button
                  className="save-draft-button"
                  type="button"
                  onClick={saveDraftAndLeave}
                  disabled={selectedIds.length === 0}
                >
                  저장하기
                </button>
              </div>
            </section>
          </div>
        )}

        {savedNotice && <div className="toast" role="status">QR이 새 메뉴로 바뀌었어요</div>}
        {shareNotice && (
          <div className={`toast ${shareNotice.error ? "error" : ""}`} role={shareNotice.error ? "alert" : "status"}>
            {shareNotice.message}
          </div>
        )}
      </section>
    </main>
  );
}
