import assert from "node:assert/strict";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { build } from "esbuild";

const backendRoot = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const entryPoints = [
  "src/handlers/health.ts",
  "src/handlers/list-stores.ts",
  "src/handlers/list-menus.ts",
  "src/handlers/get-menu.ts",
  "src/handlers/resolve-menus.ts",
  "src/handlers/create-draft.ts",
  "src/handlers/get-draft.ts",
  "src/handlers/complete-draft.ts",
];

test("Lambda handlers bundle when backend is the only CodeUri source", async () => {
  const isolatedCodeUri = await mkdtemp(join(tmpdir(), "prepped-sam-codeuri-"));

  try {
    await cp(join(backendRoot, "src"), join(isolatedCodeUri, "src"), { recursive: true });

    await assert.doesNotReject(build({
      absWorkingDir: isolatedCodeUri,
      bundle: true,
      entryPoints,
      format: "esm",
      logLevel: "silent",
      outdir: join(isolatedCodeUri, "dist"),
      packages: "external",
      platform: "node",
      target: "node22",
    }));
  } finally {
    await rm(isolatedCodeUri, { force: true, recursive: true });
  }
});
