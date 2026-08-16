import assert from "node:assert/strict";
import test from "node:test";

import { DynamoCatalogRepository } from "../src/catalog/dynamo-catalog.ts";
import { catalogManifest, catalogMenus, catalogSnapshot } from "./catalog-test-data.ts";

type Command = { constructor: { name: string }; input: Record<string, unknown> };

test("queries a category page and returns an opaque DynamoDB cursor", async () => {
  const commands: Command[] = [];
  const repository = new DynamoCatalogRepository({
    tableName: "prepped-dev-catalog",
    client: {
      send: async (command: unknown) => {
        commands.push(command as Command);
        return {
          Items: [{ menu: catalogMenus[0] }],
          LastEvaluatedKey: { pk: "STORE#mcdonald", sk: "MENU#burger#0001#mcdonald-big-mac" },
        };
      },
    },
  });

  const page = await repository.listMenus({ storeId: "mcdonald", categoryId: "burger", limit: 1 });

  assert.equal(commands[0].constructor.name, "QueryCommand");
  assert.deepEqual(commands[0].input.ExpressionAttributeValues, {
    ":pk": "STORE#mcdonald",
    ":prefix": "MENU#burger#",
  });
  assert.equal(commands[0].input.ConsistentRead, true);
  assert.equal(page.menus[0].id, "mcdonald-big-mac");
  assert.ok(page.nextCursor);

  const decoded = JSON.parse(Buffer.from(page.nextCursor, "base64url").toString("utf8"));
  assert.deepEqual(decoded, { pk: "STORE#mcdonald", sk: "MENU#burger#0001#mcdonald-big-mac" });
});

test("uses fixed keys for stores and lookup projections for bulk menu resolution", async () => {
  const commands: Command[] = [];
  const repository = new DynamoCatalogRepository({
    tableName: "prepped-dev-catalog",
    client: {
      send: async (command: unknown) => {
        const typed = command as Command;
        commands.push(typed);
        if (commands.length === 1) {
          return {
            Responses: {
              "prepped-dev-catalog": catalogSnapshot.stores.map((store) => ({ store })),
            },
          };
        }
        return {
          Responses: {
            "prepped-dev-catalog": catalogMenus.slice(0, 2).map((menu) => ({ menu })),
          },
        };
      },
    },
  });

  const stores = await repository.listStores();
  const menus = await repository.getMenus(["mcdonald-big-mac", "subway-egg-mayo-15cm"]);

  assert.equal(stores.length, 3);
  assert.deepEqual(menus.map((menu) => menu.id), ["mcdonald-big-mac", "subway-egg-mayo-15cm"]);
  assert.deepEqual(
    (commands[1].input.RequestItems as Record<string, { Keys: unknown[] }>)["prepped-dev-catalog"].Keys,
    [
      { pk: "MENU#mcdonald-big-mac", sk: "META" },
      { pk: "MENU#subway-egg-mayo-15cm", sk: "META" },
    ],
  );
});

test("reads the manifest consistently and rejects malformed cursors before querying", async () => {
  let calls = 0;
  const repository = new DynamoCatalogRepository({
    tableName: "prepped-dev-catalog",
    client: {
      send: async () => {
        calls += 1;
        return { Item: { manifest: catalogManifest } };
      },
    },
  });

  assert.equal((await repository.getManifest()).version, "2026-08-16");
  await assert.rejects(
    repository.listMenus({ storeId: "mcdonald", limit: 10, cursor: "not-json" }),
    /cursor 형식/,
  );
  assert.equal(calls, 1);
});
