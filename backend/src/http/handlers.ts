import { CatalogError } from "../catalog/domain.ts";
import { CatalogService } from "../catalog/service.ts";
import { DomainError, DraftService, type CreateDraftInput } from "../domain/drafts.ts";

type HttpEvent = {
  body: string | null;
  pathParameters?: Record<string, string | undefined>;
  queryStringParameters?: Record<string, string | undefined>;
  headers?: Record<string, string | undefined>;
  requestContext?: { requestId?: string };
};

type HttpResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};

type ErrorPayload = {
  error: {
    code: string;
    message: string;
    retryable: boolean;
    requestId: string;
  };
};

function headerValue(headers: HttpEvent["headers"], name: string): string | undefined {
  return Object.entries(headers ?? {}).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1];
}

function response(event: HttpEvent, allowedOrigins: string[], statusCode: number, payload: unknown): HttpResponse {
  const origin = headerValue(event.headers, "origin");
  const headers: Record<string, string> = { "content-type": "application/json; charset=utf-8" };
  if (origin && allowedOrigins.includes(origin)) {
    headers["access-control-allow-origin"] = origin;
    headers.vary = "Origin";
  }
  return { statusCode, headers, body: JSON.stringify(payload) };
}

function requestId(event: HttpEvent): string {
  return event.requestContext?.requestId ?? "unknown";
}

function errorResponse(event: HttpEvent, allowedOrigins: string[], error: unknown): HttpResponse {
  if (error instanceof CatalogError) {
    const statusCode = error.code === "STORE_NOT_FOUND" || error.code === "MENU_NOT_FOUND" ? 404 : 400;
    return response(event, allowedOrigins, statusCode, {
      error: {
        code: error.code,
        message: error.message,
        retryable: false,
        requestId: requestId(event),
      },
    } satisfies ErrorPayload);
  }
  if (error instanceof DomainError) {
    const statusCode = error.code === "DRAFT_NOT_FOUND" ? 404 : error.code === "IDEMPOTENCY_CONFLICT" ? 409 : 400;
    const payload: ErrorPayload = {
      error: {
        code: error.code,
        message: error.message,
        retryable: false,
        requestId: requestId(event),
      },
    };
    return response(event, allowedOrigins, statusCode, payload);
  }
  const payload: ErrorPayload = {
    error: {
      code: "INTERNAL_ERROR",
      message: "일시적인 오류가 발생했습니다. 다시 시도해주세요.",
      retryable: true,
      requestId: requestId(event),
    },
  };
  return response(event, allowedOrigins, 500, payload);
}

function parseJson(event: HttpEvent): unknown {
  if (!event.body) throw new DomainError("VALIDATION_ERROR", "요청 본문이 필요합니다.");
  try {
    return JSON.parse(event.body);
  } catch {
    throw new DomainError("VALIDATION_ERROR", "JSON 요청 형식이 올바르지 않습니다.");
  }
}

function parseCreateDraft(input: unknown): CreateDraftInput {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new DomainError("VALIDATION_ERROR", "메뉴 선택 정보를 다시 확인해주세요.");
  }
  const value = input as Record<string, unknown>;
  if (typeof value.storeId !== "string" || !Array.isArray(value.items)) {
    throw new DomainError("VALIDATION_ERROR", "매장과 메뉴 정보를 다시 확인해주세요.");
  }
  return {
    storeId: value.storeId,
    items: value.items.map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        throw new DomainError("VALIDATION_ERROR", "메뉴 정보를 다시 확인해주세요.");
      }
      const menu = item as Record<string, unknown>;
      if (typeof menu.menuId !== "string" || typeof menu.quantity !== "number") {
        throw new DomainError("VALIDATION_ERROR", "메뉴 정보를 다시 확인해주세요.");
      }
      if (menu.optionIds !== undefined && (!Array.isArray(menu.optionIds) || !menu.optionIds.every((option) => typeof option === "string"))) {
        throw new DomainError("VALIDATION_ERROR", "옵션 정보를 다시 확인해주세요.");
      }
      return { menuId: menu.menuId, quantity: menu.quantity, optionIds: menu.optionIds as string[] | undefined };
    }),
  };
}

function tokenFrom(event: HttpEvent): string {
  const token = event.pathParameters?.token;
  if (!token || !/^[A-Za-z0-9_-]{16,128}$/.test(token)) {
    throw new DomainError("DRAFT_NOT_FOUND", "주문 초안을 찾을 수 없습니다.");
  }
  return token;
}

function pathValue(event: HttpEvent, name: string): string {
  const value = event.pathParameters?.[name];
  if (!value) throw new CatalogError("VALIDATION_ERROR", `${name} 경로 값이 필요합니다.`);
  return value;
}

function parseResolveInput(input: unknown): { storeId: string; menuIds: string[] } {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new CatalogError("VALIDATION_ERROR", "매장과 메뉴 ID를 다시 확인해주세요.");
  }
  const value = input as Record<string, unknown>;
  if (typeof value.storeId !== "string" || !Array.isArray(value.menuIds) || !value.menuIds.every((id) => typeof id === "string")) {
    throw new CatalogError("VALIDATION_ERROR", "매장과 메뉴 ID를 다시 확인해주세요.");
  }
  return { storeId: value.storeId, menuIds: value.menuIds as string[] };
}

function requireCatalogService(service: CatalogService | undefined): CatalogService {
  if (!service) throw new Error("Catalog service is not configured");
  return service;
}

export function createHttpHandlers(
  service: DraftService,
  allowedOrigins: string[],
  catalogService?: CatalogService,
) {
  return {
    health: async (event: HttpEvent): Promise<HttpResponse> =>
      response(event, allowedOrigins, 200, { data: { status: "ok", service: "prepped-order-api", version: "v1" } }),

    listStores: async (event: HttpEvent): Promise<HttpResponse> => {
      try {
        const result = await requireCatalogService(catalogService).listStores();
        return response(event, allowedOrigins, 200, { data: result });
      } catch (error) {
        return errorResponse(event, allowedOrigins, error);
      }
    },

    listMenus: async (event: HttpEvent): Promise<HttpResponse> => {
      try {
        const rawLimit = event.queryStringParameters?.limit;
        const result = await requireCatalogService(catalogService).listMenus({
          storeId: pathValue(event, "storeId"),
          categoryId: event.queryStringParameters?.category,
          cursor: event.queryStringParameters?.cursor,
          limit: rawLimit === undefined ? undefined : Number(rawLimit),
        });
        return response(event, allowedOrigins, 200, { data: result });
      } catch (error) {
        return errorResponse(event, allowedOrigins, error);
      }
    },

    getMenu: async (event: HttpEvent): Promise<HttpResponse> => {
      try {
        const result = await requireCatalogService(catalogService).getMenu(pathValue(event, "menuId"));
        return response(event, allowedOrigins, 200, { data: result });
      } catch (error) {
        return errorResponse(event, allowedOrigins, error);
      }
    },

    resolveMenus: async (event: HttpEvent): Promise<HttpResponse> => {
      try {
        const result = await requireCatalogService(catalogService).resolveMenus(parseResolveInput(parseJson(event)));
        return response(event, allowedOrigins, 200, { data: result });
      } catch (error) {
        return errorResponse(event, allowedOrigins, error);
      }
    },

    createDraft: async (event: HttpEvent): Promise<HttpResponse> => {
      try {
        const created = await service.createDraft(parseCreateDraft(parseJson(event)));
        return response(event, allowedOrigins, 201, { data: created });
      } catch (error) {
        return errorResponse(event, allowedOrigins, error);
      }
    },

    getDraft: async (event: HttpEvent): Promise<HttpResponse> => {
      try {
        const draft = await service.getDraft(tokenFrom(event));
        return response(event, allowedOrigins, 200, { data: { draft } });
      } catch (error) {
        return errorResponse(event, allowedOrigins, error);
      }
    },

    completeDraft: async (event: HttpEvent): Promise<HttpResponse> => {
      try {
        const payload = parseJson(event) as Record<string, unknown>;
        if (payload.paymentMethod !== "demo") {
          throw new DomainError("VALIDATION_ERROR", "현재는 데모 결제만 지원합니다.");
        }
        const completed = await service.completeDraft(tokenFrom(event), headerValue(event.headers, "idempotency-key") ?? "");
        return response(event, allowedOrigins, completed.idempotentReplay ? 200 : 201, { data: completed });
      } catch (error) {
        return errorResponse(event, allowedOrigins, error);
      }
    },
  };
}
