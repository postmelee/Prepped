import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "키오스크 QR 스캐너",
  description: "Prepped QR을 카메라로 인식하는 키오스크 데모",
};

export default function KioskLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
