const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { createCatalogService } = require("./lib/catalog-service");

const repoRoot = __dirname;
const catalogService = createCatalogService(repoRoot);
const staticFiles = new Map([
  ["/", { filePath: path.join(repoRoot, "index.html"), contentType: "text/html; charset=utf-8" }],
  ["/index.html", { filePath: path.join(repoRoot, "index.html"), contentType: "text/html; charset=utf-8" }],
  ["/styles.css", { filePath: path.join(repoRoot, "styles.css"), contentType: "text/css; charset=utf-8" }],
  ["/data/app-data.json", { filePath: path.join(repoRoot, "data", "app-data.json"), contentType: "application/json; charset=utf-8" }],
  ["/data/star-citizen-catalog.json", { filePath: path.join(repoRoot, "data", "star-citizen-catalog.json"), contentType: "application/json; charset=utf-8" }],
]);

async function readJson(filePath) {
  const source = await fs.readFile(filePath, "utf8");
  return JSON.parse(source);
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function getQueryFilters(url) {
  return {
    category: url.searchParams.get("category"),
    facility: url.searchParams.get("facility"),
    grade: url.searchParams.get("grade"),
    itemId: url.searchParams.get("itemId"),
    locationId: url.searchParams.get("locationId"),
    q: url.searchParams.get("q"),
    region: url.searchParams.get("region"),
    resourceType: url.searchParams.get("resourceType"),
    service: url.searchParams.get("service"),
    system: url.searchParams.get("system"),
    type: url.searchParams.get("type"),
  };
}

async function sendCatalogResponse(response, loader, url) {
  try {
    const data = await loader(getQueryFilters(url));
    sendJson(response, 200, {
      data,
      meta: {
        count: Array.isArray(data) ? data.length : 0,
      },
    });
  } catch {
    sendJson(response, 500, { error: "Failed to load catalog data." });
  }
}

async function sendStaticFile(response, asset) {
  try {
    const contents = await fs.readFile(asset.filePath);

    response.writeHead(200, {
      "Content-Type": asset.contentType,
      "Cache-Control": "no-cache",
    });
    response.end(contents);
  } catch {
    sendJson(response, 500, { error: "Failed to load asset." });
  }
}

function isSafePathname(pathname) {
  try {
    const decodedPath = decodeURIComponent(pathname);

    if (decodedPath !== path.posix.normalize(decodedPath)) {
      return false;
    }

    return !decodedPath.split("/").includes("..");
  } catch {
    return false;
  }
}

function createServer() {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url || "/", "http://127.0.0.1");

    if (request.method !== "GET") {
      sendJson(response, 405, { error: "Method not allowed." });
      return;
    }

    if (url.pathname === "/api/health") {
      sendJson(response, 200, { status: "ok" });
      return;
    }

    if (url.pathname === "/api/app-data") {
      try {
        const appData = await readJson(path.join(repoRoot, "data", "app-data.json"));
        sendJson(response, 200, appData);
      } catch {
        sendJson(response, 500, { error: "Failed to load app data." });
      }
      return;
    }

    if (url.pathname === "/api/catalog") {
      try {
        const catalog = await catalogService.getCatalog();
        sendJson(response, 200, catalog);
      } catch {
        sendJson(response, 500, { error: "Failed to load catalog." });
      }
      return;
    }

    if (url.pathname === "/api/sources") {
      await sendCatalogResponse(response, () => catalogService.getSources(), url);
      return;
    }

    if (url.pathname === "/api/items") {
      await sendCatalogResponse(response, (filters) => catalogService.getItems(filters), url);
      return;
    }

    if (url.pathname === "/api/locations") {
      await sendCatalogResponse(response, (filters) => catalogService.getLocations(filters), url);
      return;
    }

    if (url.pathname === "/api/components") {
      await sendCatalogResponse(response, (filters) => catalogService.getComponents(filters), url);
      return;
    }

    if (url.pathname === "/api/crafting") {
      await sendCatalogResponse(response, (filters) => catalogService.getCrafting(filters), url);
      return;
    }

    if (url.pathname === "/api/mining") {
      await sendCatalogResponse(response, (filters) => catalogService.getMining(filters), url);
      return;
    }

    if (!isSafePathname(url.pathname)) {
      sendJson(response, 404, { error: "Not found." });
      return;
    }

    const asset = staticFiles.get(url.pathname);

    if (asset) {
      await sendStaticFile(response, asset);
      return;
    }

    sendJson(response, 404, { error: "Not found." });
  });
}

async function startServer(port = Number(process.env.PORT) || 3000) {
  const server = createServer();

  await new Promise((resolve) => {
    server.listen(port, resolve);
  });

  return server;
}

if (require.main === module) {
  startServer()
    .then((server) => {
      const address = server.address();
      const activePort = typeof address === "object" && address ? address.port : 3000;
      console.log(`Star Ops backend running on http://127.0.0.1:${activePort}`);
    })
    .catch((error) => {
      console.error("Failed to start server.", error);
      process.exitCode = 1;
    });
}

module.exports = {
  createServer,
  startServer,
};
