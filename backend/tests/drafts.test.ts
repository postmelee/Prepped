import assert from "node:assert/strict";
import test from "node:test";

import {
  DomainError,
  DraftService,
  InMemoryDraftRepository,
  type CompletedOrder,
  type DraftRepository,
  type DraftSnapshot,
} from "../src/domain/drafts.ts";

function createService() {
  return new DraftService({
    repository: new InMemoryDraftRepository(),
    tokenFactory: () => "draft-token-abcdefghijklmnopqrstuvwxyz0123456789",
    clock: () => new Date("2026-08-16T05:00:00Z"),
    draftTtlDays: 30,
  });
}

test("creates a server-priced draft and QR lookup URL", async () => {
  const service = createService();

  const created = await service.createDraft({
    storeId: "mcdonald",
    items: [{ menuId: "103", quantity: 1, optionIds: ["single", "no-pickle"] }],
  });

  assert.equal(created.draft.store.name, "맥도날드");
  assert.equal(created.draft.items[0]?.name, "1955 버거");
  assert.equal(created.draft.items[0]?.lineTotal, 7200);
  assert.equal(created.draft.totalPrice, 7200);
  assert.equal(created.qrPayload, "https://kiosk.prepped.example/kiosk?draft=draft-token-abcdefghijklmnopqrstuvwxyz0123456789");
});

test("returns the same active draft for repeated QR lookups", async () => {
  const service = createService();
  const { draft } = await service.createDraft({
    storeId: "mcdonald",
    items: [{ menuId: "201", quantity: 2, optionIds: [] }],
  });

  const first = await service.getDraft(draft.token);
  const second = await service.getDraft(draft.token);

  assert.deepEqual(second, first);
  assert.equal(second.items[0]?.lineTotal, 6000);
});

test("replays one completion request but creates a new order for a new key", async () => {
  const service = createService();
  const { draft } = await service.createDraft({
    storeId: "mcdonald",
    items: [{ menuId: "101", quantity: 1, optionIds: [] }],
  });

  const first = await service.completeDraft(draft.token, "b3e1f23a-c83f-4f0f-bbe5-8db3175431a1");
  const replay = await service.completeDraft(draft.token, "b3e1f23a-c83f-4f0f-bbe5-8db3175431a1");
  const anotherUse = await service.completeDraft(draft.token, "56bc0d27-8094-4a7b-b3f3-28762b8f0359");

  assert.equal(first.idempotentReplay, false);
  assert.equal(replay.idempotentReplay, true);
  assert.equal(replay.order.id, first.order.id);
  assert.notEqual(anotherUse.order.id, first.order.id);
  assert.equal((await service.getDraft(draft.token)).token, draft.token);
});

test("returns the persisted result when a concurrent completion wins the same idempotency key", async () => {
  class ConcurrentCompletionRepository implements DraftRepository {
    private draft?: DraftSnapshot;
    private completion?: CompletedOrder;

    async saveDraft(savedDraft: DraftSnapshot): Promise<void> {
      this.draft = structuredClone(savedDraft);
    }

    async findDraft(token: string): Promise<DraftSnapshot | undefined> {
      return this.draft?.token === token ? structuredClone(this.draft) : undefined;
    }

    async findCompletion(_token: string, _idempotencyKey: string): Promise<CompletedOrder | undefined> {
      return this.completion ? structuredClone(this.completion) : undefined;
    }

    async saveCompletion(
      _token: string,
      _idempotencyKey: string,
      order: CompletedOrder,
      _expiresAt: string,
    ): Promise<void> {
      this.completion = structuredClone(order);
      throw new Error("conditional completion write lost the idempotency race");
    }
  }

  const service = new DraftService({
    repository: new ConcurrentCompletionRepository(),
    tokenFactory: () => "draft-token-abcdefghijklmnopqrstuvwxyz0123456789",
    orderIdFactory: () => "ord_concurrent",
    clock: () => new Date("2026-08-16T05:00:00Z"),
  });
  const { draft } = await service.createDraft({
    storeId: "mcdonald",
    items: [{ menuId: "101", quantity: 1, optionIds: [] }],
  });

  const result = await service.completeDraft(draft.token, "b3e1f23a-c83f-4f0f-bbe5-8db3175431a1");

  assert.equal(result.idempotentReplay, true);
  assert.equal(result.order.id, "ord_concurrent");
});

test("rejects a menu that does not belong to the server catalog", async () => {
  const service = createService();

  await assert.rejects(
    service.createDraft({
      storeId: "mcdonald",
      items: [{ menuId: "999", quantity: 1, optionIds: [] }],
    }),
    (error: unknown) => error instanceof DomainError && error.code === "VALIDATION_ERROR",
  );
});

test("uses a 256-bit URL-safe token when no token factory is supplied", async () => {
  const service = new DraftService({
    repository: new InMemoryDraftRepository(),
    clock: () => new Date("2026-08-16T05:00:00Z"),
  });

  const { draft } = await service.createDraft({
    storeId: "mcdonald",
    items: [{ menuId: "301", quantity: 1, optionIds: [] }],
  });

  assert.match(draft.token, /^[A-Za-z0-9_-]{43}$/);
});
