/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { handleLocalCatalogRequest } from "../shared/catalog/local-api.ts";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
  PREPPED_API_BASE_URL?: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

function catalogApiPath(pathname: string): string | undefined {
  if (pathname === "/api/catalog/stores") return "/v1/stores";
  if (pathname === "/api/catalog/resolve") return "/v1/catalog/resolve";
  const storeMenus = pathname.match(/^\/api\/catalog\/stores\/([^/]+)\/menus$/);
  if (storeMenus) return `/v1/stores/${storeMenus[1]}/menus`;
  const menu = pathname.match(/^\/api\/catalog\/menus\/([^/]+)$/);
  if (menu) return `/v1/menus/${menu[1]}`;
  return undefined;
}

async function proxyCatalogRequest(request: Request, apiBaseUrl: string, path: string): Promise<Response> {
  try {
    const base = new URL(apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`);
    if (base.protocol !== "https:" && !(base.protocol === "http:" && ["localhost", "127.0.0.1"].includes(base.hostname))) {
      throw new Error("PREPPED_API_BASE_URL must use HTTPS");
    }
    const original = new URL(request.url);
    const target = new URL(path.replace(/^\//, ""), base);
    target.search = original.search;
    const headers = new Headers(request.headers);
    headers.delete("host");
    return fetch(target, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
      redirect: "manual",
    });
  } catch {
    return new Response(JSON.stringify({
      error: {
        code: "CATALOG_UPSTREAM_ERROR",
        message: "메뉴 서버에 연결할 수 없습니다.",
        retryable: true,
        requestId: "catalog-proxy",
      },
    }), {
      status: 502,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    });
  }
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/catalog")) {
      const upstreamPath = catalogApiPath(url.pathname);
      if (env.PREPPED_API_BASE_URL && upstreamPath) {
        return proxyCatalogRequest(request, env.PREPPED_API_BASE_URL, upstreamPath);
      }
      return handleLocalCatalogRequest(request);
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
