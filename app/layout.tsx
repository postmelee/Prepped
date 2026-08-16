import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto");
  const protocol = forwardedProtocol ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    title: {
      default: "한끼패스 · 내 메뉴 QR",
      template: "%s · 한끼패스",
    },
    description: "자주 먹는 메뉴를 미리 담고 키오스크에서 QR로 한 번에 주문하세요.",
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "한끼패스",
    },
    icons: {
      icon: "/icon-192.png",
      apple: "/icon-192.png",
    },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      title: "한끼패스 · 내 메뉴 QR",
      description: "자주 먹는 메뉴를 미리 담고 키오스크에서 QR로 주문하세요.",
      images: [{ url: `${origin}/og.png`, width: 1731, height: 909, alt: "한끼패스 내 메뉴 QR" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "한끼패스 · 내 메뉴 QR",
      description: "자주 먹는 메뉴를 미리 담고 키오스크에서 QR로 주문하세요.",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <meta name="theme-color" content="#f7f4ee" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body>{children}</body>
    </html>
  );
}
