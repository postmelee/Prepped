import { randomBytes, randomUUID } from "node:crypto";

type CatalogOption = {
  id: string;
  name: string;
  priceDelta: number;
};

type CatalogMenu = {
  id: string;
  name: string;
  price: number;
  options: CatalogOption[];
};

const MCDONALD_MENU: CatalogMenu[] = [
  { id: "101", name: "빅맥", price: 6300, options: [{ id: "single", name: "단품", priceDelta: 0 }] },
  { id: "102", name: "불고기 버거", price: 3500, options: [{ id: "single", name: "단품", priceDelta: 0 }] },
  {
    id: "103",
    name: "1955 버거",
    price: 7200,
    options: [
      { id: "single", name: "단품", priceDelta: 0 },
      { id: "no-pickle", name: "피클 제외", priceDelta: 0 },
    ],
  },
  { id: "104", name: "맥스파이시 상하이 버거", price: 6500, options: [{ id: "single", name: "단품", priceDelta: 0 }] },
  { id: "201", name: "후렌치 후라이", price: 3000, options: [] },
  { id: "202", name: "맥너겟 6조각", price: 4600, options: [] },
  { id: "203", name: "해쉬 브라운", price: 1800, options: [] },
  { id: "301", name: "코카콜라", price: 2600, options: [] },
  { id: "302", name: "아메리카노", price: 3300, options: [] },
  { id: "303", name: "바닐라 쉐이크", price: 3500, options: [] },
];

export type CreateDraftInput = {
  storeId: string;
  items: Array<{
    menuId: string;
    quantity: number;
    optionIds?: string[];
  }>;
};

export type DraftSnapshot = {
  token: string;
  store: { id: string; name: string };
  items: Array<{
    menuId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    options: CatalogOption[];
    lineTotal: number;
  }>;
  totalPrice: number;
  currency: "KRW";
  createdAt: string;
  expiresAt: string;
};

export type CompletedOrder = {
  id: string;
  draftToken: string;
  status: "COMPLETED";
  paymentMethod: "demo";
  confirmedAt: string;
  totalPrice: number;
  currency: "KRW";
};

export type CompletionResult = {
  order: CompletedOrder;
  idempotentReplay: boolean;
};

export class DomainError extends Error {
  readonly code: "VALIDATION_ERROR" | "DRAFT_NOT_FOUND" | "IDEMPOTENCY_CONFLICT";

  constructor(
    code: "VALIDATION_ERROR" | "DRAFT_NOT_FOUND" | "IDEMPOTENCY_CONFLICT",
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}

export interface DraftRepository {
  saveDraft(draft: DraftSnapshot): Promise<void>;
  findDraft(token: string): Promise<DraftSnapshot | undefined>;
  findCompletion(token: string, idempotencyKey: string): Promise<CompletedOrder | undefined>;
  saveCompletion(token: string, idempotencyKey: string, order: CompletedOrder, expiresAt: string): Promise<void>;
}

export class InMemoryDraftRepository implements DraftRepository {
  private readonly drafts = new Map<string, DraftSnapshot>();
  private readonly completions = new Map<string, CompletedOrder>();

  async saveDraft(draft: DraftSnapshot): Promise<void> {
    this.drafts.set(draft.token, structuredClone(draft));
  }

  async findDraft(token: string): Promise<DraftSnapshot | undefined> {
    const draft = this.drafts.get(token);
    return draft ? structuredClone(draft) : undefined;
  }

  async findCompletion(token: string, idempotencyKey: string): Promise<CompletedOrder | undefined> {
    const order = this.completions.get(`${token}:${idempotencyKey}`);
    return order ? structuredClone(order) : undefined;
  }

  async saveCompletion(token: string, idempotencyKey: string, order: CompletedOrder, _expiresAt: string): Promise<void> {
    this.completions.set(`${token}:${idempotencyKey}`, structuredClone(order));
  }
}

type DraftServiceOptions = {
  repository: DraftRepository;
  tokenFactory?: () => string;
  orderIdFactory?: () => string;
  clock?: () => Date;
  draftTtlDays?: number;
  kioskBaseUrl?: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class DraftService {
  private readonly repository: DraftRepository;
  private readonly tokenFactory: () => string;
  private readonly orderIdFactory: () => string;
  private readonly clock: () => Date;
  private readonly draftTtlDays: number;
  private readonly kioskBaseUrl: string;

  constructor(options: DraftServiceOptions) {
    this.repository = options.repository;
    this.tokenFactory = options.tokenFactory ?? (() => randomBytes(32).toString("base64url"));
    this.orderIdFactory = options.orderIdFactory ?? (() => `ord_${randomUUID()}`);
    this.clock = options.clock ?? (() => new Date());
    this.draftTtlDays = options.draftTtlDays ?? 30;
    this.kioskBaseUrl = options.kioskBaseUrl ?? "https://kiosk.prepped.example";
  }

  async createDraft(input: CreateDraftInput): Promise<{ draft: DraftSnapshot; qrPayload: string }> {
    const store = this.resolveStore(input.storeId);
    if (!Array.isArray(input.items) || input.items.length === 0 || input.items.length > 20) {
      throw new DomainError("VALIDATION_ERROR", "메뉴는 1개 이상 20개 이하로 선택해주세요.");
    }

    const items = input.items.map((item) => this.toSnapshotItem(item));
    const createdAt = this.clock();
    const expiresAt = new Date(createdAt.getTime() + this.draftTtlDays * 24 * 60 * 60 * 1000);
    const draft: DraftSnapshot = {
      token: this.tokenFactory(),
      store,
      items,
      totalPrice: items.reduce((total, item) => total + item.lineTotal, 0),
      currency: "KRW",
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    await this.repository.saveDraft(draft);
    return {
      draft: structuredClone(draft),
      qrPayload: `${this.kioskBaseUrl}/kiosk?draft=${encodeURIComponent(draft.token)}`,
    };
  }

  async getDraft(token: string): Promise<DraftSnapshot> {
    const draft = await this.repository.findDraft(token);
    if (!draft || new Date(draft.expiresAt).getTime() <= this.clock().getTime()) {
      throw new DomainError("DRAFT_NOT_FOUND", "주문 초안을 찾을 수 없습니다.");
    }
    return draft;
  }

  async completeDraft(token: string, idempotencyKey: string): Promise<CompletionResult> {
    if (!UUID_PATTERN.test(idempotencyKey)) {
      throw new DomainError("VALIDATION_ERROR", "Idempotency-Key는 UUID 형식이어야 합니다.");
    }

    const existing = await this.repository.findCompletion(token, idempotencyKey);
    if (existing) return { order: existing, idempotentReplay: true };

    const draft = await this.getDraft(token);
    const order: CompletedOrder = {
      id: this.orderIdFactory(),
      draftToken: draft.token,
      status: "COMPLETED",
      paymentMethod: "demo",
      confirmedAt: this.clock().toISOString(),
      totalPrice: draft.totalPrice,
      currency: draft.currency,
    };
    try {
      await this.repository.saveCompletion(token, idempotencyKey, order, draft.expiresAt);
      return { order, idempotentReplay: false };
    } catch (error) {
      const concurrentCompletion = await this.repository.findCompletion(token, idempotencyKey);
      if (concurrentCompletion) return { order: concurrentCompletion, idempotentReplay: true };
      throw error;
    }
  }

  private resolveStore(storeId: string): DraftSnapshot["store"] {
    if (storeId !== "mcdonald") {
      throw new DomainError("VALIDATION_ERROR", "지원하지 않는 매장입니다.");
    }
    return { id: "mcdonald", name: "맥도날드" };
  }

  private toSnapshotItem(input: CreateDraftInput["items"][number]): DraftSnapshot["items"][number] {
    if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 9) {
      throw new DomainError("VALIDATION_ERROR", "수량은 1개 이상 9개 이하로 선택해주세요.");
    }
    const menu = MCDONALD_MENU.find((candidate) => candidate.id === input.menuId);
    if (!menu) throw new DomainError("VALIDATION_ERROR", "지원하지 않는 메뉴입니다.");

    const optionIds = input.optionIds ?? [];
    if (new Set(optionIds).size !== optionIds.length) {
      throw new DomainError("VALIDATION_ERROR", "같은 옵션을 중복 선택할 수 없습니다.");
    }
    const options = optionIds.map((optionId) => {
      const option = menu.options.find((candidate) => candidate.id === optionId);
      if (!option) throw new DomainError("VALIDATION_ERROR", "지원하지 않는 메뉴 옵션입니다.");
      return { ...option };
    });
    const unitPrice = menu.price + options.reduce((total, option) => total + option.priceDelta, 0);
    return {
      menuId: menu.id,
      name: menu.name,
      quantity: input.quantity,
      unitPrice,
      options,
      lineTotal: unitPrice * input.quantity,
    };
  }
}
