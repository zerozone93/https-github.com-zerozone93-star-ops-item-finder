const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const {
  RemoteJsonConnector,
  StarCitizenWikiConnector,
  createCatalogService,
} = require("../lib/catalog-service");

const repoRoot = path.resolve(__dirname, "..");

test("maps remote json feeds into normalized item records", async () => {
  const connector = new RemoteJsonConnector({
    id: "test-items",
    name: "Test items",
    kind: "json",
    endpoint: "https://example.invalid/items",
    entityType: "items",
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        data: [
          {
            id: "weapon-test",
            name: "Test Laser Rifle",
            category: "weapon",
            subcategory: "rifle",
            manufacturer: "Acme",
            tags: ["fps", "laser"],
          },
        ],
      }),
    }),
  });

  const result = await connector.load();

  assert.equal(result.source.status, "ok");
  assert.equal(result.catalog.items.length, 1);
  assert.equal(result.catalog.items[0].name, "Test Laser Rifle");
  assert.deepEqual(result.catalog.items[0].sourceIds, ["test-items"]);
});

test("maps wiki connector payloads into normalized data", async () => {
  const connector = new StarCitizenWikiConnector({
    baseUrl: "https://wiki.example.invalid",
    fetchImpl: async (url) => ({
      ok: true,
      json: async () => {
        if (url.endsWith("/api/items")) {
          return {
            data: [
              {
                uuid: "wiki-item",
                name: "CF-337 Panther",
                section: "weapon",
                class: "laser-repeater",
                manufacturer: { name: "Klaus & Werner" },
              },
            ],
          };
        }

        return {
          data: [
            {
              name: "Stanton",
              children: [
                {
                  id: "seraphim",
                  name: "Seraphim Station",
                  type: "station",
                },
              ],
            },
          ],
        };
      },
    }),
  });

  const result = await connector.load();

  assert.equal(result.source.status, "ok");
  assert.equal(result.catalog.items[0].name, "CF-337 Panther");
  assert.equal(result.catalog.locations[0].name, "Seraphim Station");
});

test("catalog service merges local data with remote feeds", async () => {
  const service = createCatalogService(repoRoot, {
    connectors: [
      new RemoteJsonConnector({
        id: "extra-components",
        name: "Extra components",
        kind: "json",
        endpoint: "https://example.invalid/components",
        entityType: "components",
        fetchImpl: async () => ({
          ok: true,
          json: async () => ({
            data: [
              {
                id: "component-atlas",
                itemId: "ship-component-atlas-quantum-drive",
                name: "Atlas Quantum Drive",
                type: "quantum-drive",
                grade: "B",
              },
            ],
          }),
        }),
      }),
      {
        async load() {
          const localService = createCatalogService(repoRoot, { cacheTtlMs: 1 });
          const catalog = await localService.getCatalog();

          return {
            source: { id: "local-proxy", name: "Local proxy", kind: "file", status: "ok", enabled: true },
            catalog,
          };
        },
      },
    ],
  });

  const components = await service.getComponents({ type: "quantum-drive" });

  assert.ok(components.some((component) => component.name === "VK-00 Quantum Drive"));
  assert.ok(components.some((component) => component.name === "Atlas Quantum Drive"));
});
