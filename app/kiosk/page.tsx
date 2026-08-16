"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

import { KioskMenuResult } from "../components/kiosk-menu-result.tsx";
import { KIOSK_STORE_NAMES, KioskStoreSelector, kioskBrandClass } from "../components/kiosk-store-selector.tsx";
import { resolveQrForStore, type KioskCatalogResolution } from "../lib/catalog/resolve.ts";
import type { StoreKey } from "../../shared/catalog/types.ts";

type ScanState = "idle" | "starting" | "scanning" | "found" | "error";
type ResolutionState = "idle" | "loading" | "success" | "error";

const DEMO_QR = "mcdonald={mcdonald-178,mcdonald-720,mcdonald-28};subway={subway-1530-15cm};starbucks={starbucks-94}";

export default function KioskPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const [selectedStore, setSelectedStore] = useState<StoreKey | null>(null);
  const [state, setState] = useState<ScanState>("idle");
  const [resolutionState, setResolutionState] = useState<ResolutionState>("idle");
  const [resolution, setResolution] = useState<KioskCatalogResolution | null>(null);
  const [resolutionError, setResolutionError] = useState("");
  const [rawValue, setRawValue] = useState("");
  const [manualValue, setManualValue] = useState("");
  const [paid, setPaid] = useState(false);

  function stopCamera() {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    frameRef.current = null;
  }

  useEffect(() => () => stopCamera(), []);

  function resetScan() {
    stopCamera();
    setRawValue("");
    setManualValue("");
    setResolution(null);
    setResolutionError("");
    setResolutionState("idle");
    setState("idle");
  }

  async function resolveRawValue(value: string) {
    if (!selectedStore) return;
    setResolutionState("loading");
    setResolutionError("");
    setResolution(null);
    try {
      setResolution(await resolveQrForStore(value, selectedStore));
      setResolutionState("success");
    } catch (error) {
      setResolutionError(error instanceof Error ? error.message : "메뉴 서버에 연결할 수 없습니다.");
      setResolutionState("error");
    }
  }

  function handleQrValue(value: string) {
    const normalized = value.trim();
    if (!normalized) return;
    setPaid(false);
    setRawValue(normalized);
    setManualValue(normalized);
    setState("found");
    stopCamera();
    void resolveRawValue(normalized);
  }

  async function startCamera() {
    setPaid(false);
    setRawValue("");
    setResolution(null);
    setResolutionState("idle");
    setState("starting");
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setState("scanning");
      scanFrame();
    } catch {
      setState("error");
    }
  }

  function scanFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current) return;
    if (video.readyState >= video.HAVE_ENOUGH_DATA) {
      const maxWidth = 1000;
      const scale = Math.min(1, maxWidth / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const image = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(image.data, image.width, image.height, { inversionAttempts: "dontInvert" });
        if (code?.data) {
          handleQrValue(code.data);
          return;
        }
      }
    }
    frameRef.current = requestAnimationFrame(scanFrame);
  }

  if (paid && selectedStore) {
    return (
      <main className="kiosk-page">
        <section className="payment-complete">
          <span className="complete-check">✓</span>
          <span className="complete-store">{KIOSK_STORE_NAMES[selectedStore]}</span>
          <h1>결제가 완료되었습니다</h1>
          <p>주문번호</p><strong>128</strong>
          <button type="button" onClick={() => { setPaid(false); setSelectedStore(null); resetScan(); }}>처음으로</button>
        </section>
      </main>
    );
  }

  return (
    <main className="kiosk-page">
      <header className="kiosk-header">
        <div className="kiosk-brand">
          <span className={selectedStore ? kioskBrandClass(selectedStore) : ""}>{selectedStore === "starbucks" ? "★" : selectedStore === "subway" ? "S" : "M"}</span>
          <div><strong>QR 메뉴 주문</strong>{selectedStore && <small>{KIOSK_STORE_NAMES[selectedStore]} 키오스크</small>}</div>
        </div>
        <div className="kiosk-help">
          {selectedStore && <button type="button" onClick={() => { resetScan(); setSelectedStore(null); }}>매장 바꾸기</button>}
          <span>도움이 필요하신가요?</span><strong>직원 호출</strong>
        </div>
      </header>

      {!selectedStore ? <KioskStoreSelector onSelect={(storeId) => { setSelectedStore(storeId); resetScan(); }} /> : (
        <div className={`kiosk-content ${state === "found" ? "result-mode" : ""}`}>
          <section className="kiosk-intro">
            <span className="kiosk-step">2단계 · {KIOSK_STORE_NAMES[selectedStore]}</span>
            <h1>{state === "found" ? "메뉴를 확인해주세요" : "휴대폰 QR을\n보여주세요"}</h1>
            <p>{state === "found" ? `QR에서 ${KIOSK_STORE_NAMES[selectedStore]} 메뉴만 불러왔습니다.` : "여러 매장이 담긴 QR도 이 매장 메뉴만 읽습니다."}</p>
          </section>

          {state !== "found" ? (
            <section className="scanner-panel">
              <div className={`camera-view ${state === "scanning" ? "live" : ""}`}>
                <video ref={videoRef} playsInline muted />
                <canvas ref={canvasRef} aria-hidden="true" />
                <div className="scanner-frame"><i /><i /><i /><i /></div>
                {state === "scanning" && <span className="scan-line" />}
                {state !== "scanning" && (
                  <div className="camera-placeholder">
                    <span className="camera-symbol">▣</span>
                    <strong>{state === "error" ? "카메라를 사용할 수 없습니다" : "카메라로 QR을 읽습니다"}</strong>
                    {state === "error" && <small>브라우저의 카메라 권한을 확인하거나 아래에 QR 문자열을 입력해주세요.</small>}
                  </div>
                )}
              </div>
              <button className="kiosk-primary" type="button" onClick={startCamera} disabled={state === "starting"}>{state === "starting" ? "카메라 준비 중…" : state === "scanning" ? "다시 시작하기" : "카메라 켜기"}</button>
              <button className="demo-link" type="button" onClick={() => handleQrValue(DEMO_QR)}>다중 매장 샘플 QR로 미리 보기</button>
              <div className="manual-qr-input">
                <label htmlFor="manual-qr">QR 문자열을 직접 입력할 수도 있어요</label>
                <div><input id="manual-qr" value={manualValue} onChange={(event) => setManualValue(event.target.value)} placeholder="mcdonald={...};subway={...}" /><button type="button" onClick={() => handleQrValue(manualValue)} disabled={!manualValue.trim()}>불러오기</button></div>
              </div>
            </section>
          ) : (
            <section className="order-panel">
              <div className="raw-code"><span>인식된 전체 QR</span><code>{rawValue}</code></div>
              <div className="parsed-list">
                <KioskMenuResult storeId={selectedStore} status={resolutionState} result={resolution} error={resolutionError} onRetry={() => void resolveRawValue(rawValue)} />
              </div>
              <div className="order-actions">
                <button className="rescan-button" type="button" onClick={resetScan}>다시 찍기</button>
                <button className="pay-button" type="button" onClick={() => setPaid(true)} disabled={resolutionState !== "success" || !resolution?.menus.length}>결제하기</button>
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
