import { DraftService } from "./domain/drafts.ts";
import { createHttpHandlers } from "./http/handlers.ts";
import { DynamoDraftRepository } from "./repositories/dynamo-drafts.ts";
import type { RuntimeConfig } from "./runtime-config.ts";

type DocumentClient = {
  send(command: unknown): Promise<unknown>;
};

export function createRuntimeHandlers(config: RuntimeConfig, client: DocumentClient) {
  const repository = new DynamoDraftRepository({ tableName: config.tableName, client });
  const service = new DraftService({
    repository,
    kioskBaseUrl: config.kioskBaseUrl,
    draftTtlDays: config.draftTtlDays,
  });
  return createHttpHandlers(service, config.allowedOrigins);
}
