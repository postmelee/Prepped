import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { createRuntimeHandlers } from "./runtime.ts";
import { readRuntimeConfig } from "./runtime-config.ts";

export function createLambdaHandlers() {
  const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
  return createRuntimeHandlers(readRuntimeConfig(process.env), client);
}
