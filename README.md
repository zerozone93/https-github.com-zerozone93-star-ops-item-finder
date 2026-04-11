# Star Ops Item Finder

Star Citizen helper for people in the verse to find what you need.

## Local test environment

This repository now includes a working local browser app for a cleaner game-style item finder interface, plus a small Node backend for serving the app, a normalized Star Citizen catalog, and optional remote data connectors.

### Open locally

- Use Node.js 18 or newer so the backend connectors can rely on the built-in `fetch` API
- `npm start` runs the backend at `http://127.0.0.1:3000`
- Open `http://127.0.0.1:3000` in a browser to use the test environment
- The frontend loads live data from the backend APIs so you can search items, change filters, inspect availability, and review crafting/mining/component details without publishing the app

### Run tests

- `npm test` runs the HTML/CSS regression checks.
- `npm run test:coverage` runs the same suite with Node's built-in coverage output.

### App data

- `data/app-data.json` contains the structured app content and UI copy for the local test environment.
- `data/star-citizen-catalog.json` contains the canonical local catalog for items, locations, mining, crafting, and components.

### Catalog model

The backend now exposes a normalized catalog model with these top-level entities:

- `items` for armor, weapons, attachments, medical items, mining resources, and crafting materials
- `locations` for shops, stations, and refinery locations plus inventory snapshots
- `components` for ship component stats such as type, size, grade, and power draw
- `crafting.recipes` for blueprint-style output/input relationships
- `mining.resources` for ore locations and refinery methods

### Optional Star Citizen connectors

The backend always serves the local canonical catalog, and can optionally enrich it from external Star Citizen data sources when these environment variables are set:

- `STAR_CITIZEN_WIKI_BASE_URL`
- `STAR_CITIZEN_ITEMS_FEED_URL`
- `STAR_CITIZEN_LOCATIONS_FEED_URL`
- `STAR_CITIZEN_COMPONENTS_FEED_URL`
- `STAR_CITIZEN_CRAFTING_FEED_URL`
- `STAR_CITIZEN_MINING_FEED_URL`

Remote feeds should return JSON arrays or `{ data: [...] }` payloads. The API merges available remote records into the local catalog and reports connector status from `/api/sources`.

### Backend API

- `GET /api/health` returns the backend health status
- `GET /api/app-data` returns the app JSON used by the mockup
- `GET /api/catalog` returns the merged normalized catalog
- `GET /api/sources` returns connector status for the local catalog plus optional remote data sources
- `GET /api/items` returns normalized item records, with optional `category`, `locationId`, and `q` filters
- `GET /api/locations` returns normalized locations, with optional `itemId`, `service`, `system`, and `q` filters
- `GET /api/components` returns normalized ship components, with optional `itemId`, `type`, `grade`, and `q` filters
- `GET /api/crafting` returns crafting recipes, with optional `outputItemId` and `facility` filters
- `GET /api/mining` returns mining resources, with optional `itemId`, `resourceType`, `region`, and `q` filters
