import assert from "node:assert/strict";
import test from "node:test";

import { DynamoDraftRepository } from "../src/repositories/dynamo-drafts.ts";
import type { CompletedOrder, DraftSnapshot } from "../src/domain/drafts.ts";

const draft: DraftSnapshot = {
  token: "draft-token-abcdefghijklmnopqrstuvwxyz0123456789",
  store: { id: "mcdonald", name: "맥도날드" },
  items: [],
  totalPrice: 7200,
  currency: "KRW",
  createdAt: "2026-08-16T05:00:00Z",
  expiresAt: "2026-09-15T05:00:00Z",
};

const order: CompletedOrder = {
  id: "ord_123",
  draftToken: draft.token,
  status: "COMPLETED",
  paymentMethod: "demo",
  confirmedAt: "2026-08-16T05:01:00Z",
  totalPrice: 7200,
  currency: "KRW",
};

test("stores a draft under DRAFT token metadata with a TTL timestamp", async () => {
  const commands: Array<{ input: Record<string, unknown> }> = [];
  const repository = new DynamoDraftRepository({
    tableName: "prepped-dev-orders",
    client: { send: async (command: { input: Record<string, unknown> }) => commands.push(command) },
  });

  await repository.saveDraft(draft);

  assert.deepEqual(commands[0]?.input, {
    TableName: "prepped-dev-orders",
    Item: {
      pk: `DRAFT#${draft.token}`,
      sk: "META",
      entity: "DRAFT",
      draft,
      expiresAtEpoch: 1789448400,
    },
  });
});

test("stores a completion replay record and a separate durable order atomically", async () => {
  const commands: Array<{ input: Record<string, unknown> }> = [];
  const repository = new DynamoDraftRepository({
    tableName: "prepped-dev-orders",
    client: { send: async (command: { input: Record<string, unknown> }) => commands.push(command) },
  });

  await repository.saveCompletion(draft.token, "b3e1f23a-c83f-4f0f-bbe5-8db3175431a1", order, draft.expiresAt);

  assert.deepEqual(commands[0]?.input, {
    TransactItems: [
      {
        Put: {
          TableName: "prepped-dev-orders",
          Item: {
            pk: `DRAFT#${draft.token}`,
            sk: "COMPLETE#b3e1f23a-c83f-4f0f-bbe5-8db3175431a1",
            entity: "COMPLETION",
            order,
            expiresAtEpoch: 1789448400,
          },
          ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)",
        },
      },
      {
        Put: {
          TableName: "prepped-dev-orders",
          Item: {
            pk: "ORDER#ord_123",
            sk: "META",
            entity: "ORDER",
            order,
          },
          ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)",
        },
      },
    ],
  });
});
