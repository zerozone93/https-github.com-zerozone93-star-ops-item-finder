const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { filterItems, normalizeText } = require('../src/itemFinder');
const { createServer } = require('../server');

test('normalizeText trims and lowercases values', () => {
  assert.equal(normalizeText('  MedPen '), 'medpen');
});

test('filterItems matches by query text', () => {
  const results = filterItems({ query: 'tractor' });

  assert.equal(results.length, 1);
  assert.equal(results[0].id, 'tractor-beam');
});

test('filterItems supports category and location filters', () => {
  const results = filterItems({ category: 'utility', location: 'area18' });

  assert.equal(results.length, 1);
  assert.equal(results[0].name, 'Tractor Beam Attachment');
});

test('filterItems applies limits', () => {
  const results = filterItems({ limit: 2 });

  assert.equal(results.length, 2);
});

test('api returns filtered items as json', async () => {
  const server = createServer();
  server.listen(0);
  await once(server, 'listening');

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/items?q=med`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.total, 1);
  assert.equal(payload.items[0].id, 'medpen');

  server.close();
  await once(server, 'close');
});
