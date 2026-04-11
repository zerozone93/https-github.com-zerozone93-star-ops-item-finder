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
