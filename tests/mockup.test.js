const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");
const clientScript = fs.readFileSync(path.join(repoRoot, "app.js"), "utf8");
const css = fs.readFileSync(path.join(repoRoot, "styles.css"), "utf8");
const appData = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "data", "app-data.json"), "utf8"),
);

function countMatches(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

test("renders the primary item finder shell and runtime areas", () => {
  assert.match(html, /<main class="app-shell">/);
  assert.match(html, /<header class="topbar panel">/);
  assert.match(html, /<section class="hero panel">/);
  assert.match(html, /<aside class="panel sidebar">/);
  assert.match(html, /<section class="results">/);
  assert.match(html, /<article class="panel detail-card" id="detail-card">/);
  assert.match(html, /<script src="\.\/app\.js" defer><\/script>/);
});

test("includes search, category, and service controls for browsing items", () => {
  assert.match(html, /<label class="section-label" for="item-search">Search items<\/label>/);
  assert.match(html, /id="item-search"/);
  assert.match(html, /placeholder="Railgun, MedPen, Quantanium\.\.\."/);
  assert.equal(countMatches(html, /<button class="chip(?: active)?" data-category="[^"]+" type="button">/g), 5);
  assert.match(html, /<button class="chip active" data-category="all" type="button">All<\/button>/);
  assert.match(html, /id="service-filters"/);
  assert.ok(countMatches(html, /<input[^>]*type="checkbox"/g) >= 1);
});

test("provides runtime mount points for interactive results and detail panels", () => {
  assert.match(html, /id="results-title">Loading catalog/);
  assert.match(html, /id="result-grid"/);
  assert.match(html, /id="selected-item-name">Choose an item/);
  assert.match(html, /id="location-list"/);
  assert.match(html, /id="component-list"/);
  assert.match(html, /id="crafting-list"/);
  assert.match(html, /id="mining-list"/);
  assert.match(html, /id="source-list"/);
});

test("loads normalized backend data through the client application", () => {
  assert.match(clientScript, /fetchJson\("\/api\/app-data"\)/);
  assert.match(clientScript, /fetchJson\("\/api\/catalog"\)/);
  assert.match(clientScript, /fetchJson\("\/api\/sources"\)/);
  assert.match(clientScript, /fetchJson\(`\/api\/locations\?itemId=\$\{encodeURIComponent\(itemId\)\}`\)/);
  assert.match(clientScript, /fetchJson\(`\/api\/crafting\?outputItemId=\$\{encodeURIComponent\(itemId\)\}`\)/);
  assert.match(clientScript, /fetchJson\(`\/api\/mining\?itemId=\$\{encodeURIComponent\(itemId\)\}`\)/);
});

test("defines core visual tokens and shared panel styling", () => {
  assert.match(css, /:root\s*\{/);
  assert.match(css, /--bg:\s*#07111f;/);
  assert.match(css, /--accent-strong:\s*#54e0c7;/);
  assert.match(css, /\.panel\s*\{[^}]*border-radius:\s*24px;[^}]*backdrop-filter:\s*blur\(16px\);/s);
  assert.match(css, /\.chip,\s*\.ghost-button,\s*\.primary-button\s*\{[^}]*border-radius:\s*999px;[^}]*padding:\s*10px 14px;/s);
});

test("uses grid layouts and responsive breakpoints for smaller viewports", () => {
  assert.match(css, /\.hero\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0, 1\.4fr\) minmax\(320px, 0\.9fr\);/s);
  assert.match(css, /\.workspace\s*\{[^}]*grid-template-columns:\s*minmax\(280px, 320px\) minmax\(0, 1fr\);/s);
  assert.match(css, /\.result-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\);/s);
  assert.match(css, /\.detail-support-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/s);
  assert.match(css, /@media \(max-width: 960px\)\s*\{[^}]*grid-template-columns:\s*1fr;/s);
  assert.match(css, /@media \(max-width: 640px\)\s*\{[\s\S]*\.topbar-actions\s*\{[^}]*width:\s*100%;/s);
  assert.match(css, /@media \(max-width: 640px\)\s*\{[\s\S]*\.ghost-button,\s*\.primary-button\s*\{[^}]*width:\s*100%;/s);
});

test("provides reusable app JSON with the required UI content", () => {
  assert.equal(appData.app.network, "STAR OPS NETWORK");
  assert.equal(appData.app.name, "Item Finder");
  assert.equal(appData.app.title, "Star Ops Item Finder Test Environment");
  assert.equal(appData.hero.stats.length, 3);
  assert.equal(appData.sidebar.itemClasses.options.length, 5);
  assert.equal(appData.sidebar.regions.options.length, 4);
  assert.equal(appData.sidebar.priorityIntel.entries.length, 2);
  assert.equal(appData.results.cards.length, 3);
  assert.equal(appData.results.cards.filter((card) => card.featured).length, 1);
  assert.equal(appData.selectedItem.details.length, 3);
  assert.equal(appData.results.primaryAction.label, "Plot route");
});
