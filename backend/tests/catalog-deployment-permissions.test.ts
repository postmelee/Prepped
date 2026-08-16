import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("CloudFormation execution role can manage only named Prepped catalog tables", async () => {
  const bootstrap = await readFile(new URL("../infra/github-oidc-bootstrap.yaml", import.meta.url), "utf8");

  assert.match(bootstrap, /table\/prepped-\*-catalog/);
  assert.match(bootstrap, /role\/prepped-\*-catalog-api-lambda/);
  assert.doesNotMatch(bootstrap, /dynamodb:BatchWriteItem/);
});

test("CloudFormation execution role can apply SAM, TTL, and API Gateway tags", async () => {
  const bootstrap = await readFile(new URL("../infra/github-oidc-bootstrap.yaml", import.meta.url), "utf8");

  assert.match(bootstrap, /dynamodb:DescribeContinuousBackups/);
  assert.match(bootstrap, /dynamodb:DescribeTimeToLive/);
  assert.match(bootstrap, /dynamodb:UpdateContinuousBackups/);
  assert.match(bootstrap, /dynamodb:UpdateTimeToLive/);
  assert.match(bootstrap, /cloudformation:CreateChangeSet/);
  assert.match(bootstrap, /transform\/Serverless-2016-10-31/);
  assert.match(bootstrap, /apigateway:TagResource/);
  assert.match(bootstrap, /apigateway:UntagResource/);
  assert.match(bootstrap, /apigateway:\$\{AWS::Region\}::\/tags\/\*/);
});
