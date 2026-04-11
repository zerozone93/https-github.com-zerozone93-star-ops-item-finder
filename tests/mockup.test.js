const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");
const css = fs.readFileSync(path.join(repoRoot, "styles.css"), "utf8");

function countMatches(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

test("renders the primary item finder shell and navigation areas", () => {
  assert.match(html, /<main class="app-shell">/);
  assert.match(html, /<header class="topbar panel">/);
  assert.match(html, /<section class="hero panel">/);
  assert.match(html, /<aside class="panel sidebar">/);
  assert.match(html, /<section class="results">/);
  assert.match(html, /<article class="panel detail-card">/);
});

test("includes search, filter, and region controls for browsing items", () => {
  assert.match(html, /<label class="section-label" for="item-search">Search items<\/label>/);
  assert.match(html, /id="item-search"/);
  assert.match(html, /placeholder="Railgun, MedPen, Titanium\.\.\."/);
  assert.equal(countMatches(html, /<button class="chip(?: active)?" type="button">/g), 5);
  assert.match(html, /<button class="chip active" type="button">All<\/button>/);
  assert.equal(countMatches(html, /<input type="checkbox"/g), 4);
});

test("shows the expected highlighted and supporting result cards", () => {
  assert.equal(countMatches(html, /<article class="panel result-card(?: featured)?">/g), 3);
  assert.match(html, /<article class="panel result-card featured">/);
  assert.match(html, /<span class="tag">Best match<\/span>/);
  assert.match(html, /<h4>Behring P8-AR Scope Mk II<\/h4>/);
  assert.match(html, /<h4>Greycat MedPen Twin Pack<\/h4>/);
  assert.match(html, /<h4>Titanium Freight Crate<\/h4>/);
  assert.ok(countMatches(html, /<dl class="metrics">/g) >= 3);
});

test("exposes detailed route and pricing intel for the selected item", () => {
  assert.match(html, /<p class="eyebrow">Selected item<\/p>/);
  assert.match(html, /<h3>Kastak Arms Devastator Shotgun<\/h3>/);
  assert.match(html, /<span class="status-pill">12 shops reporting<\/span>/);
  assert.equal(countMatches(html, /<div class="detail-block">/g), 3);
  assert.match(html, /<strong>Orison Crusader Showroom<\/strong>/);
  assert.match(html, /<strong>GrimHEX Weapons Depot<\/strong>/);
  assert.match(html, /<strong>Low traffic window active<\/strong>/);
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
  assert.match(css, /@media \(max-width: 960px\)\s*\{[^}]*grid-template-columns:\s*1fr;/s);
  assert.match(css, /@media \(max-width: 640px\)\s*\{[\s\S]*\.topbar-actions\s*\{[^}]*width:\s*100%;/s);
  assert.match(css, /@media \(max-width: 640px\)\s*\{[\s\S]*\.ghost-button,\s*\.primary-button\s*\{[^}]*width:\s*100%;/s);
});
