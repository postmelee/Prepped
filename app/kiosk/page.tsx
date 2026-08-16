"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

type ScanState = "idle" | "starting" | "scanning" | "found" | "error";

function parsePayload(value: string) {
  const stores: { store: string; ids: string[] }[] = [];
  const pattern = /([a-zA-Z0-9_-]+)=\{([^}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(value))) {
    const ids = match[2].split(",").map((id) => id.trim()).filter(Boolean);
    stores.push({ store: match[1], ids });
  }
  return stores;
}

export default function KioskPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const [state, setState] = useState<ScanState>("idle");
  const [rawValue, setRawValue] = useState("");
  const [paid, setPaid] = useState(false);

  const parsed = parsePayload(rawValue);

  function stopCamera() {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  useEffect(() => () => stopCamera(), []);

  async function startCamera() {
    setPaid(false);
    setRawValue("");
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
          setRawValue(code.data);
          setState("found");
          stopCamera();
          return;
        }
      }
    }
    frameRef.current = requestAnimationFrame(scanFrame);
  }

  function useDemoCode() {
    setRawValue("mcdonald={101,201,301}");
    setState("found");
    stopCamera();
  }

  if (paid) {
    return (
      <main className="kiosk-page">
        <section className="payment-complete">
          <span className="complete-check">✓</span>
          <h1>결제가 완료되었습니다</h1>
          <p>주문번호</p>
          <strong>128</strong>
          <button type="button" onClick={() => { setPaid(false); setRawValue(""); setState("idle"); }}>처음으로</button>
        </section>
      </main>
    );
  }

  return (
    <main className="kiosk-page">
      <header className="kiosk-header">
        <div className="kiosk-brand"><span>M</span><strong>QR 메뉴 주문</strong></div>
        <div className="kiosk-help"><span>도움이 필요하신가요?</span><strong>직원 호출</strong></div>
      </header>

      <div className={`kiosk-content ${state === "found" ? "result-mode" : ""}`}>
        <section className="kiosk-intro">
          <span className="kiosk-step">한끼패스</span>
          <h1>{state === "found" ? "메뉴를 확인해주세요" : "휴대폰 QR을\n보여주세요"}</h1>
          <p>{state === "found" ? "QR에 저장된 주문 정보입니다." : "자주 먹는 메뉴를 바로 불러옵니다."}</p>
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
                  {state === "error" && <small>브라우저의 카메라 권한을 확인해주세요.</small>}
                </div>
              )}
            </div>
            <button className="kiosk-primary" type="button" onClick={startCamera} disabled={state === "starting"}>
              {state === "starting" ? "카메라 준비 중…" : state === "scanning" ? "다시 시작하기" : "카메라 켜기"}
            </button>
            <button className="demo-link" type="button" onClick={useDemoCode}>샘플 QR로 미리 보기</button>
          </section>
        ) : (
          <section className="order-panel">
            <div className="raw-code">
              <span>인식된 QR</span>
              <code>{rawValue}</code>
            </div>
            <div className="parsed-list">
              {parsed.length ? parsed.map((group) => (
                <div className="parsed-store" key={`${group.store}-${group.ids.join("-")}`}>
                  <div className="parsed-store-head"><span className="mini-brand">M</span><strong>{group.store === "mcdonald" ? "맥도날드" : group.store}</strong></div>
                  {group.ids.map((id, index) => (
                    <div className="id-row" key={`${id}-${index}`}><span>메뉴 ID</span><strong>{id}</strong></div>
                  ))}
                </div>
              )) : <div className="unparsed">메뉴 형식을 확인할 수 없습니다.<br /><code>{rawValue}</code></div>}
            </div>
            <div className="order-actions">
              <button className="rescan-button" type="button" onClick={startCamera}>다시 찍기</button>
              <button className="pay-button" type="button" onClick={() => setPaid(true)}>결제하기</button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
