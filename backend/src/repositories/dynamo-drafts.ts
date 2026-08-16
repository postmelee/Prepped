import { GetCommand, PutCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";

import type { CompletedOrder, DraftRepository, DraftSnapshot } from "../domain/drafts.ts";

type DocumentClient = {
  send(command: unknown): Promise<unknown>;
};

type DynamoDraftRepositoryOptions = {
  tableName: string;
  client: DocumentClient;
};

type GetResult = { Item?: Record<string, unknown> };

function toEpochSeconds(value: string): number {
  return Math.floor(new Date(value).getTime() / 1000);
}

export class DynamoDraftRepository implements DraftRepository {
  private readonly options: DynamoDraftRepositoryOptions;

  constructor(options: DynamoDraftRepositoryOptions) {
    this.options = options;
  }

  async saveDraft(draft: DraftSnapshot): Promise<void> {
    await this.options.client.send(new PutCommand({
      TableName: this.options.tableName,
      Item: {
        pk: `DRAFT#${draft.token}`,
        sk: "META",
        entity: "DRAFT",
        draft,
        expiresAtEpoch: toEpochSeconds(draft.expiresAt),
      },
    }));
  }

  async findDraft(token: string): Promise<DraftSnapshot | undefined> {
    const result = await this.options.client.send(new GetCommand({
      TableName: this.options.tableName,
      Key: { pk: `DRAFT#${token}`, sk: "META" },
      ConsistentRead: true,
    })) as GetResult;
    return result.Item?.draft as DraftSnapshot | undefined;
  }

  async findCompletion(token: string, idempotencyKey: string): Promise<CompletedOrder | undefined> {
    const result = await this.options.client.send(new GetCommand({
      TableName: this.options.tableName,
      Key: { pk: `DRAFT#${token}`, sk: `COMPLETE#${idempotencyKey}` },
      ConsistentRead: true,
    })) as GetResult;
    return result.Item?.order as CompletedOrder | undefined;
  }

  async saveCompletion(token: string, idempotencyKey: string, order: CompletedOrder, expiresAt: string): Promise<void> {
    await this.options.client.send(new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: this.options.tableName,
            Item: {
              pk: `DRAFT#${token}`,
              sk: `COMPLETE#${idempotencyKey}`,
              entity: "COMPLETION",
              order,
              expiresAtEpoch: toEpochSeconds(expiresAt),
            },
            ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)",
          },
        },
        {
          Put: {
            TableName: this.options.tableName,
            Item: {
              pk: `ORDER#${order.id}`,
              sk: "META",
              entity: "ORDER",
              order,
            },
            ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)",
          },
        },
      ],
    }));
  }
}
