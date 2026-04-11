const fs = require("node:fs/promises");
const path = require("node:path");

function createEmptyCatalog() {
  return {
    meta: {},
    items: [],
    locations: [],
    components: [],
    crafting: { recipes: [] },
    mining: { resources: [] },
    sources: [],
  };
}

async function readJson(filePath) {
  const source = await fs.readFile(filePath, "utf8");
  return JSON.parse(source);
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueStrings(values) {
  return [...new Set(ensureArray(values).filter(Boolean))];
}

function createSourceStatus(overrides) {
  return {
    id: overrides.id,
    name: overrides.name,
    kind: overrides.kind || "unknown",
    status: overrides.status || "ok",
    enabled: overrides.enabled !== false,
    detail: overrides.detail || "",
    lastFetchedAt: overrides.lastFetchedAt || new Date().toISOString(),
    error: overrides.error || null,
  };
}

function normalizeLocationInventory(location) {
  return ensureArray(location.inventories).map((inventory) => ({
    itemId: inventory.itemId,
    buyPrice: Number(inventory.buyPrice) || null,
    sellPrice: Number(inventory.sellPrice) || null,
    stock: Number(inventory.stock) || null,
    currency: inventory.currency || "aUEC",
    availability: inventory.availability || "unknown",
    lastSeenAt: inventory.lastSeenAt || null,
  }));
}

function normalizeCatalogShape(data, fallbackSourceId) {
  return {
    meta: data.meta || {},
    items: ensureArray(data.items).map((item) => ({
      id: item.id || slugify(item.name),
      name: item.name || "Unknown item",
      category: item.category || "unknown",
      subcategory: item.subcategory || null,
      manufacturer: item.manufacturer || null,
      description: item.description || "",
      tags: uniqueStrings(item.tags),
      rarity: item.rarity || null,
      size: item.size ?? null,
      grade: item.grade || null,
      sourceIds: uniqueStrings(item.sourceIds || [fallbackSourceId]),
    })),
    locations: ensureArray(data.locations).map((location) => ({
      id: location.id || slugify(location.name),
      name: location.name || "Unknown location",
      system: location.system || null,
      body: location.body || null,
      kind: location.kind || "unknown",
      services: uniqueStrings(location.services),
      notes: location.notes || "",
      sourceIds: uniqueStrings(location.sourceIds || [fallbackSourceId]),
      inventories: normalizeLocationInventory(location),
    })),
    components: ensureArray(data.components).map((component) => ({
      id: component.id || slugify(component.name || component.itemId),
      itemId: component.itemId,
      name: component.name || component.itemId || "Unknown component",
      type: component.type || "unknown",
      size: component.size ?? null,
      grade: component.grade || null,
      powerDraw: Number(component.powerDraw) || null,
      coolingRate: Number(component.coolingRate) || null,
      durability: Number(component.durability) || null,
      sourceIds: uniqueStrings(component.sourceIds || [fallbackSourceId]),
    })),
    crafting: {
      recipes: ensureArray(data.crafting && data.crafting.recipes).map((recipe) => ({
        id: recipe.id || slugify(recipe.outputItemId || recipe.name),
        outputItemId: recipe.outputItemId,
        facility: recipe.facility || null,
        outputAmount: Number(recipe.outputAmount) || 1,
        inputs: ensureArray(recipe.inputs).map((input) => ({
          itemId: input.itemId,
          amount: Number(input.amount) || 1,
        })),
        notes: recipe.notes || "",
        sourceIds: uniqueStrings(recipe.sourceIds || [fallbackSourceId]),
      })),
    },
    mining: {
      resources: ensureArray(data.mining && data.mining.resources).map((resource) => ({
        id: resource.id || slugify(resource.name || resource.itemId),
        itemId: resource.itemId,
        name: resource.name || resource.itemId || "Unknown resource",
        resourceType: resource.resourceType || "unknown",
        locations: ensureArray(resource.locations).map((location) => ({
          locationId: location.locationId || null,
          region: location.region || null,
          notes: location.notes || "",
        })),
        refinery: ensureArray(resource.refinery).map((refinery) => ({
          method: refinery.method || null,
          yieldPercent: Number(refinery.yieldPercent) || null,
          durationMinutes: Number(refinery.durationMinutes) || null,
        })),
        sourceIds: uniqueStrings(resource.sourceIds || [fallbackSourceId]),
      })),
    },
  };
}

class LocalCatalogConnector {
  constructor({ filePath }) {
    this.filePath = filePath;
    this.id = "local-catalog";
    this.name = "Local canonical catalog";
    this.kind = "file";
  }

  async load() {
    const catalog = normalizeCatalogShape(await readJson(this.filePath), this.id);
    return {
      source: createSourceStatus({
        id: this.id,
        name: this.name,
        kind: this.kind,
      }),
      catalog,
    };
  }
}

class RemoteJsonConnector {
  constructor({ id, name, kind, endpoint, entityType, fetchImpl = global.fetch }) {
    this.id = id;
    this.name = name;
    this.kind = kind;
    this.endpoint = endpoint;
    this.entityType = entityType;
    this.fetchImpl = fetchImpl;
  }

  isEnabled() {
    return Boolean(this.endpoint);
  }

  extractRecords(payload) {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (Array.isArray(payload && payload.data)) {
      return payload.data;
    }

    if (Array.isArray(payload && payload.items)) {
      return payload.items;
    }

    if (Array.isArray(payload && payload.results)) {
      return payload.results;
    }

    return [];
  }

  mapRecord(record) {
    if (this.entityType === "items") {
      return {
        id: record.id || slugify(record.name),
        name: record.name,
        category: record.category || record.type || "unknown",
        subcategory: record.subcategory || record.group || null,
        manufacturer: record.manufacturer || null,
        description: record.description || "",
        tags: uniqueStrings(record.tags || record.labels),
        rarity: record.rarity || null,
        size: record.size ?? null,
        grade: record.grade || null,
        sourceIds: [this.id],
      };
    }

    if (this.entityType === "locations") {
      return {
        id: record.id || slugify(record.name),
        name: record.name,
        system: record.system || null,
        body: record.body || record.planet || null,
        kind: record.kind || record.type || "unknown",
        services: uniqueStrings(record.services),
        notes: record.notes || "",
        sourceIds: [this.id],
        inventories: normalizeLocationInventory({
          inventories: record.inventories || record.items || [],
        }),
      };
    }

    if (this.entityType === "components") {
      return {
        id: record.id || slugify(record.name || record.itemId),
        itemId: record.itemId || record.item_id || null,
        name: record.name || record.itemName || "Unknown component",
        type: record.type || record.componentType || "unknown",
        size: record.size ?? null,
        grade: record.grade || null,
        powerDraw: Number(record.powerDraw || record.power_draw) || null,
        coolingRate: Number(record.coolingRate || record.cooling_rate) || null,
        durability: Number(record.durability) || null,
        sourceIds: [this.id],
      };
    }

    if (this.entityType === "recipes") {
      return {
        id: record.id || slugify(record.outputItemId || record.name),
        outputItemId: record.outputItemId || record.output_item_id || null,
        facility: record.facility || null,
        outputAmount: Number(record.outputAmount || record.output_amount) || 1,
        inputs: ensureArray(record.inputs).map((input) => ({
          itemId: input.itemId || input.item_id,
          amount: Number(input.amount) || 1,
        })),
        notes: record.notes || "",
        sourceIds: [this.id],
      };
    }

    return {
      id: record.id || slugify(record.name || record.itemId),
      itemId: record.itemId || record.item_id || null,
      name: record.name || record.itemName || "Unknown resource",
      resourceType: record.resourceType || record.type || "unknown",
      locations: ensureArray(record.locations).map((location) => ({
        locationId: location.locationId || location.location_id || null,
        region: location.region || null,
        notes: location.notes || "",
      })),
      refinery: ensureArray(record.refinery || record.refining).map((entry) => ({
        method: entry.method || null,
        yieldPercent: Number(entry.yieldPercent || entry.yield_percent) || null,
        durationMinutes: Number(entry.durationMinutes || entry.duration_minutes) || null,
      })),
      sourceIds: [this.id],
    };
  }

  async load() {
    if (!this.isEnabled()) {
      return {
        source: createSourceStatus({
          id: this.id,
          name: this.name,
          kind: this.kind,
          enabled: false,
          status: "disabled",
          detail: "Set the connector URL environment variable to enable this source.",
        }),
        catalog: createEmptyCatalog(),
      };
    }

    try {
      const response = await this.fetchImpl(this.endpoint, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Unexpected status ${response.status}`);
      }

      const payload = await response.json();
      const records = this.extractRecords(payload).map((record) => this.mapRecord(record));
      const catalog = createEmptyCatalog();

      if (this.entityType === "items") {
        catalog.items = records;
      } else if (this.entityType === "locations") {
        catalog.locations = records;
      } else if (this.entityType === "components") {
        catalog.components = records;
      } else if (this.entityType === "recipes") {
        catalog.crafting.recipes = records;
      } else if (this.entityType === "resources") {
        catalog.mining.resources = records;
      }

      return {
        source: createSourceStatus({
          id: this.id,
          name: this.name,
          kind: this.kind,
          detail: `Fetched ${records.length} ${this.entityType}.`,
        }),
        catalog,
      };
    } catch (error) {
      return {
        source: createSourceStatus({
          id: this.id,
          name: this.name,
          kind: this.kind,
          status: "error",
          detail: "The remote source could not be loaded.",
          error: error.message,
        }),
        catalog: createEmptyCatalog(),
      };
    }
  }
}

class StarCitizenWikiConnector {
  constructor({ baseUrl = process.env.STAR_CITIZEN_WIKI_BASE_URL, fetchImpl = global.fetch }) {
    this.baseUrl = baseUrl ? String(baseUrl).replace(/\/+$/, "") : "";
    this.fetchImpl = fetchImpl;
    this.id = "star-citizen-wiki";
    this.name = "Star Citizen Wiki API";
    this.kind = "rest";
  }

  isEnabled() {
    return Boolean(this.baseUrl);
  }

  mapWikiItems(payload) {
    const records = Array.isArray(payload)
      ? payload
      : Array.isArray(payload && payload.data)
        ? payload.data
        : [];

    return records.map((item) => ({
      id: item.uuid || item.id || slugify(item.name),
      name: item.name || "Unknown item",
      category: item.section || item.type || "unknown",
      subcategory: item.class || item.subtype || null,
      manufacturer: item.manufacturer?.name || item.manufacturer || null,
      description: item.description || "",
      tags: uniqueStrings(item.tags || item.type_filter),
      rarity: item.rarity || null,
      size: item.size ?? null,
      grade: item.grade || null,
      sourceIds: [this.id],
    }));
  }

  mapWikiLocations(payload) {
    const systems = Array.isArray(payload)
      ? payload
      : Array.isArray(payload && payload.data)
        ? payload.data
        : [];

    const locations = [];

    for (const system of systems) {
      for (const child of ensureArray(system.children)) {
        locations.push({
          id: child.id || slugify(`${system.name}-${child.name}`),
          name: child.name || "Unknown location",
          system: system.name || null,
          body: child.type || null,
          kind: child.type || "unknown",
          services: [],
          notes: child.description || "",
          sourceIds: [this.id],
          inventories: [],
        });
      }
    }

    return locations;
  }

  async fetchJson(url) {
    const response = await this.fetchImpl(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Unexpected status ${response.status}`);
    }

    return response.json();
  }

  async load() {
    if (!this.isEnabled()) {
      return {
        source: createSourceStatus({
          id: this.id,
          name: this.name,
          kind: this.kind,
          enabled: false,
          status: "disabled",
          detail: "Set STAR_CITIZEN_WIKI_BASE_URL to enable the wiki connector.",
        }),
        catalog: createEmptyCatalog(),
      };
    }

    try {
      const [itemsPayload, locationsPayload] = await Promise.all([
        this.fetchJson(`${this.baseUrl}/api/items`),
        this.fetchJson(`${this.baseUrl}/api/starmap`),
      ]);

      return {
        source: createSourceStatus({
          id: this.id,
          name: this.name,
          kind: this.kind,
          detail: "Fetched item and starmap data from the wiki API.",
        }),
        catalog: {
          meta: {},
          items: this.mapWikiItems(itemsPayload),
          locations: this.mapWikiLocations(locationsPayload),
          components: [],
          crafting: { recipes: [] },
          mining: { resources: [] },
          sources: [],
        },
      };
    } catch (error) {
      return {
        source: createSourceStatus({
          id: this.id,
          name: this.name,
          kind: this.kind,
          status: "error",
          detail: "The Star Citizen Wiki API could not be loaded.",
          error: error.message,
        }),
        catalog: createEmptyCatalog(),
      };
    }
  }
}

function mergeLists(baseList, nextList, mergeRecord) {
  const merged = new Map(baseList.map((record) => [record.id, record]));

  for (const record of nextList) {
    const existing = merged.get(record.id);
    merged.set(record.id, existing ? mergeRecord(existing, record) : record);
  }

  return [...merged.values()];
}

function mergeCatalogs(catalogs) {
  return catalogs.reduce((merged, catalog) => {
    merged.items = mergeLists(merged.items, ensureArray(catalog.items), (current, incoming) => ({
      ...current,
      ...incoming,
      tags: uniqueStrings([...(current.tags || []), ...(incoming.tags || [])]),
      sourceIds: uniqueStrings([...(current.sourceIds || []), ...(incoming.sourceIds || [])]),
    }));

    merged.locations = mergeLists(merged.locations, ensureArray(catalog.locations), (current, incoming) => ({
      ...current,
      ...incoming,
      services: uniqueStrings([...(current.services || []), ...(incoming.services || [])]),
      sourceIds: uniqueStrings([...(current.sourceIds || []), ...(incoming.sourceIds || [])]),
      inventories: [
        ...(current.inventories || []),
        ...(incoming.inventories || []),
      ],
    }));

    merged.components = mergeLists(merged.components, ensureArray(catalog.components), (current, incoming) => ({
      ...current,
      ...incoming,
      sourceIds: uniqueStrings([...(current.sourceIds || []), ...(incoming.sourceIds || [])]),
    }));

    merged.crafting.recipes = mergeLists(
      merged.crafting.recipes,
      ensureArray(catalog.crafting && catalog.crafting.recipes),
      (current, incoming) => ({
        ...current,
        ...incoming,
        inputs: incoming.inputs?.length ? incoming.inputs : current.inputs,
        sourceIds: uniqueStrings([...(current.sourceIds || []), ...(incoming.sourceIds || [])]),
      }),
    );

    merged.mining.resources = mergeLists(
      merged.mining.resources,
      ensureArray(catalog.mining && catalog.mining.resources),
      (current, incoming) => ({
        ...current,
        ...incoming,
        locations: incoming.locations?.length ? incoming.locations : current.locations,
        refinery: incoming.refinery?.length ? incoming.refinery : current.refinery,
        sourceIds: uniqueStrings([...(current.sourceIds || []), ...(incoming.sourceIds || [])]),
      }),
    );

    return merged;
  }, createEmptyCatalog());
}

function buildConnectors(repoRoot, options = {}) {
  const fetchImpl = options.fetchImpl || global.fetch;

  return [
    new LocalCatalogConnector({
      filePath: path.join(repoRoot, "data", "star-citizen-catalog.json"),
    }),
    new StarCitizenWikiConnector({
      baseUrl: options.starCitizenWikiBaseUrl || process.env.STAR_CITIZEN_WIKI_BASE_URL,
      fetchImpl,
    }),
    new RemoteJsonConnector({
      id: "star-citizen-items-feed",
      name: "Star Citizen item feed",
      kind: "json",
      endpoint: options.itemsFeedUrl || process.env.STAR_CITIZEN_ITEMS_FEED_URL,
      entityType: "items",
      fetchImpl,
    }),
    new RemoteJsonConnector({
      id: "star-citizen-locations-feed",
      name: "Star Citizen location feed",
      kind: "json",
      endpoint: options.locationsFeedUrl || process.env.STAR_CITIZEN_LOCATIONS_FEED_URL,
      entityType: "locations",
      fetchImpl,
    }),
    new RemoteJsonConnector({
      id: "star-citizen-components-feed",
      name: "Star Citizen component feed",
      kind: "json",
      endpoint: options.componentsFeedUrl || process.env.STAR_CITIZEN_COMPONENTS_FEED_URL,
      entityType: "components",
      fetchImpl,
    }),
    new RemoteJsonConnector({
      id: "star-citizen-crafting-feed",
      name: "Star Citizen crafting feed",
      kind: "json",
      endpoint: options.craftingFeedUrl || process.env.STAR_CITIZEN_CRAFTING_FEED_URL,
      entityType: "recipes",
      fetchImpl,
    }),
    new RemoteJsonConnector({
      id: "star-citizen-mining-feed",
      name: "Star Citizen mining feed",
      kind: "json",
      endpoint: options.miningFeedUrl || process.env.STAR_CITIZEN_MINING_FEED_URL,
      entityType: "resources",
      fetchImpl,
    }),
  ];
}

function filterBySearch(records, query, selector) {
  if (!query) {
    return records;
  }

  const normalizedQuery = query.trim().toLowerCase();

  return records.filter((record) => selector(record).some((value) => String(value || "").toLowerCase().includes(normalizedQuery)));
}

function createCatalogService(repoRoot, options = {}) {
  const cacheTtlMs = options.cacheTtlMs || 300000;
  const connectors = options.connectors || buildConnectors(repoRoot, options);
  let cachedCatalog = null;
  let cachedAt = 0;

  async function loadCatalog(forceRefresh = false) {
    const now = Date.now();

    if (!forceRefresh && cachedCatalog && now - cachedAt < cacheTtlMs) {
      return cachedCatalog;
    }

    const results = await Promise.all(connectors.map((connector) => connector.load()));
    const merged = mergeCatalogs(results.map((result) => result.catalog));

    merged.meta = {
      version: "1.0.0",
      loadedAt: new Date(now).toISOString(),
      connectorCount: connectors.length,
    };
    merged.sources = results.map((result) => result.source);

    cachedCatalog = merged;
    cachedAt = now;

    return merged;
  }

  return {
    async getCatalog() {
      return loadCatalog(false);
    },

    async getSources() {
      const catalog = await loadCatalog(false);
      return catalog.sources;
    },

    async getItems(filters = {}) {
      const catalog = await loadCatalog(Boolean(filters.refresh));
      let items = [...catalog.items];

      if (filters.category) {
        items = items.filter((item) => item.category === filters.category);
      }

      if (filters.locationId) {
        const location = catalog.locations.find((entry) => entry.id === filters.locationId);
        const inventoryIds = new Set(ensureArray(location && location.inventories).map((entry) => entry.itemId));
        items = items.filter((item) => inventoryIds.has(item.id));
      }

      items = filterBySearch(items, filters.q, (item) => [
        item.name,
        item.category,
        item.subcategory,
        item.manufacturer,
        ...(item.tags || []),
      ]);

      return items;
    },

    async getLocations(filters = {}) {
      const catalog = await loadCatalog(Boolean(filters.refresh));
      let locations = [...catalog.locations];

      if (filters.itemId) {
        locations = locations.filter((location) =>
          ensureArray(location.inventories).some((inventory) => inventory.itemId === filters.itemId),
        );
      }

      if (filters.service) {
        locations = locations.filter((location) => ensureArray(location.services).includes(filters.service));
      }

      if (filters.system) {
        locations = locations.filter((location) => location.system === filters.system);
      }

      locations = filterBySearch(locations, filters.q, (location) => [
        location.name,
        location.system,
        location.body,
        location.kind,
        ...(location.services || []),
      ]);

      return locations;
    },

    async getComponents(filters = {}) {
      const catalog = await loadCatalog(Boolean(filters.refresh));
      let components = [...catalog.components];

      if (filters.type) {
        components = components.filter((component) => component.type === filters.type);
      }

      if (filters.grade) {
        components = components.filter((component) => component.grade === filters.grade);
      }

      return filterBySearch(components, filters.q, (component) => [
        component.name,
        component.type,
        component.grade,
      ]);
    },

    async getCrafting(filters = {}) {
      const catalog = await loadCatalog(Boolean(filters.refresh));
      let recipes = [...catalog.crafting.recipes];

      if (filters.outputItemId) {
        recipes = recipes.filter((recipe) => recipe.outputItemId === filters.outputItemId);
      }

      if (filters.facility) {
        recipes = recipes.filter((recipe) => recipe.facility === filters.facility);
      }

      return recipes;
    },

    async getMining(filters = {}) {
      const catalog = await loadCatalog(Boolean(filters.refresh));
      let resources = [...catalog.mining.resources];

      if (filters.itemId) {
        resources = resources.filter((resource) => resource.itemId === filters.itemId);
      }

      if (filters.resourceType) {
        resources = resources.filter((resource) => resource.resourceType === filters.resourceType);
      }

      if (filters.region) {
        resources = resources.filter((resource) =>
          ensureArray(resource.locations).some((location) => location.region === filters.region),
        );
      }

      return filterBySearch(resources, filters.q, (resource) => [
        resource.name,
        resource.resourceType,
      ]);
    },
  };
}

module.exports = {
  LocalCatalogConnector,
  RemoteJsonConnector,
  StarCitizenWikiConnector,
  buildConnectors,
  createCatalogService,
  createEmptyCatalog,
};
