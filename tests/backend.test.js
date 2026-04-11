const test = require("node:test");
const assert = require("node:assert/strict");
const { startServer } = require("../server");

let server;
let baseUrl;

test.before(async () => {
  server = await startServer(0);
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

test("serves health status from the backend", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
  assert.deepEqual(payload, { status: "ok" });
});

test("serves app data from the backend API", async () => {
  const response = await fetch(`${baseUrl}/api/app-data`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.app.name, "Item Finder");
  assert.equal(payload.results.cards.length, 3);
  assert.equal(payload.selectedItem.name, "Kastak Arms Devastator Shotgun");
});

test("serves the normalized star citizen catalog", async () => {
  const response = await fetch(`${baseUrl}/api/catalog`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.items.length, 10);
  assert.equal(payload.locations.length, 5);
  assert.equal(payload.components.length, 3);
  assert.equal(payload.crafting.recipes.length, 2);
  assert.equal(payload.mining.resources.length, 2);
});

test("filters normalized items and locations", async () => {
  const [itemsResponse, locationsResponse] = await Promise.all([
    fetch(`${baseUrl}/api/items?category=attachment&q=scope`),
    fetch(`${baseUrl}/api/locations?itemId=attachment-behring-p8-ar-scope-mk-ii`),
  ]);

  const itemsPayload = await itemsResponse.json();
  const locationsPayload = await locationsResponse.json();

  assert.equal(itemsResponse.status, 200);
  assert.equal(itemsPayload.meta.count, 1);
  assert.equal(itemsPayload.data[0].name, "Behring P8-AR Scope Mk II");

  assert.equal(locationsResponse.status, 200);
  assert.equal(locationsPayload.meta.count, 1);
  assert.equal(locationsPayload.data[0].name, "New Babbage Commons");
});

test("serves component, crafting, mining, and source endpoints", async () => {
  const [componentsResponse, craftingResponse, miningResponse, sourcesResponse] = await Promise.all([
    fetch(`${baseUrl}/api/components?type=quantum-drive`),
    fetch(`${baseUrl}/api/crafting?outputItemId=ship-component-js-400-power-plant`),
    fetch(`${baseUrl}/api/mining?region=Aaron%20Halo`),
    fetch(`${baseUrl}/api/sources`),
  ]);

  const componentsPayload = await componentsResponse.json();
  const craftingPayload = await craftingResponse.json();
  const miningPayload = await miningResponse.json();
  const sourcesPayload = await sourcesResponse.json();

  assert.equal(componentsResponse.status, 200);
  assert.equal(componentsPayload.meta.count, 1);
  assert.equal(componentsPayload.data[0].name, "VK-00 Quantum Drive");

  assert.equal(craftingResponse.status, 200);
  assert.equal(craftingPayload.meta.count, 1);
  assert.equal(craftingPayload.data[0].facility, "Station engineering workshop");

  assert.equal(miningResponse.status, 200);
  assert.equal(miningPayload.meta.count, 1);
  assert.equal(miningPayload.data[0].name, "Quantanium");

  assert.equal(sourcesResponse.status, 200);
  assert.equal(sourcesPayload.meta.count, 7);
  assert.equal(sourcesPayload.data[0].id, "local-catalog");
  assert.equal(sourcesPayload.data[1].status, "disabled");
});

test("serves the existing static frontend through the backend", async () => {
  const [indexResponse, stylesResponse] = await Promise.all([
    fetch(`${baseUrl}/`),
    fetch(`${baseUrl}/styles.css`),
  ]);

  assert.equal(indexResponse.status, 200);
  assert.equal(stylesResponse.status, 200);
  assert.match(indexResponse.headers.get("content-type"), /^text\/html/);
  assert.match(stylesResponse.headers.get("content-type"), /^text\/css/);
  assert.match(await indexResponse.text(), /<title>Star Ops Item Finder Mockup<\/title>/);
});

test("rejects unknown and unsafe paths", async () => {
  const [missingResponse, traversalResponse] = await Promise.all([
    fetch(`${baseUrl}/does-not-exist`),
    fetch(`${baseUrl}/../../package.json`),
  ]);

  assert.equal(missingResponse.status, 404);
  assert.equal(traversalResponse.status, 404);
});

test("rejects unsupported methods", async () => {
  const response = await fetch(`${baseUrl}/api/app-data`, { method: "POST" });
  const payload = await response.json();

  assert.equal(response.status, 405);
  assert.equal(payload.error, "Method not allowed.");
});
