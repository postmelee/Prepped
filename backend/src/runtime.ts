import { DynamoCatalogRepository } from "./catalog/dynamo-catalog.ts";
import { CatalogService } from "./catalog/service.ts";
import { DraftService } from "./domain/drafts.ts";
import { createHttpHandlers } from "./http/handlers.ts";
import { DynamoDraftRepository } from "./repositories/dynamo-drafts.ts";
import type { RuntimeConfig } from "./runtime-config.ts";

type DocumentClient = {
  send(command: unknown): Promise<unknown>;
};

export function createRuntimeHandlers(config: RuntimeConfig, client: DocumentClient) {
  const draftRepository = new DynamoDraftRepository({ tableName: config.tableName, client });
  const draftService = new DraftService({
    repository: draftRepository,
    kioskBaseUrl: config.kioskBaseUrl,
    draftTtlDays: config.draftTtlDays,
  });
  const catalogRepository = new DynamoCatalogRepository({ tableName: config.catalogTableName, client });
  const catalogService = new CatalogService(catalogRepository);
  return createHttpHandlers(draftService, config.allowedOrigins, catalogService);
}
