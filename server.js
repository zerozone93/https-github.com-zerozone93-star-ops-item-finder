const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { filterItems } = require('./src/itemFinder');

const publicDir = path.join(__dirname, 'public');

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function sendFile(response, filePath, contentType) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(response, 500, { error: 'Unable to load resource.' });
      return;
    }

    response.writeHead(200, { 'Content-Type': contentType });
    response.end(content);
  });
}

function createServer() {
  return http.createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost');

    if (url.pathname === '/api/items') {
      const q = url.searchParams.get('q') || '';
      const category = url.searchParams.get('category') || '';
      const location = url.searchParams.get('location') || '';
      const limitParam = Number(url.searchParams.get('limit'));
      const items = filterItems({
        query: q,
        category,
        location,
        limit: Number.isFinite(limitParam) && limitParam > 0 ? limitParam : undefined,
      });

      sendJson(response, 200, { items, total: items.length });
      return;
    }

    if (url.pathname === '/') {
      sendFile(response, path.join(publicDir, 'index.html'), 'text/html; charset=utf-8');
      return;
    }

    if (url.pathname === '/app.js') {
      sendFile(response, path.join(publicDir, 'app.js'), 'application/javascript; charset=utf-8');
      return;
    }

    if (url.pathname === '/styles.css') {
      sendFile(response, path.join(publicDir, 'styles.css'), 'text/css; charset=utf-8');
      return;
    }

    sendJson(response, 404, { error: 'Not found.' });
  });
}

function startServer(port = process.env.PORT || 3000) {
  const server = createServer();

  server.listen(port, () => {
    console.log(`Star Ops Item Finder running at http://localhost:${port}`);
  });

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = {
  createServer,
  startServer,
};
