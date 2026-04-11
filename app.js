const FALLBACK_DATA = {
  meta: {
    appName: "Star Ops Item Finder",
    datasetName: "embedded-fallback",
    generatedOn: "2026-04-11",
    gameVersionTarget: "Star Citizen Alpha 4.7.x",
  },
  gameSystems: [
    { id: "stanton", name: "Stanton" },
    { id: "pyro", name: "Pyro" },
  ],
  locations: [
    { id: "aberdeen", name: "Aberdeen", systemId: "stanton" },
    { id: "daymar", name: "Daymar", systemId: "stanton" },
    { id: "area18", name: "Area18", systemId: "stanton" },
    { id: "new_babbage", name: "New Babbage", systemId: "stanton" },
    { id: "lorville", name: "Lorville", systemId: "stanton" },
  ],
  miningMethods: [
    { id: "fps_mining", name: "FPS mining" },
    { id: "roc_mining", name: "ROC mining" },
  ],
  toolsAndVehicles: [
    {
      id: "pyro_ryt_multi_tool",
      name: "Pyro RYT Multi-Tool",
      kind: "tool",
      manufacturer: "Greycat Industrial",
      roles: ["fps_mining", "repair", "tractor"],
      verificationStatus: "verified",
      sourceRefs: ["src_wiki_pyro_multitool"],
    },
    {
      id: "macflex_rucksack_backpack",
      name: 'MacFlex "Rucksack" Backpack',
      kind: "backpack",
      manufacturer: "Roberts Space Industries",
      roles: ["ore_storage", "expedition"],
      verificationStatus: "verified",
      sourceRefs: ["src_wiki_macflex_rucksack"],
    },
  ],
  stores: [
    {
      id: "centermass_area18",
      name: "CenterMass",
      category: "weapons_and_armor",
      locationId: "area18",
      subLocation: "IO-North Tower, 2nd floor",
      products: ["personal_weapons", "personal_armor"],
      verificationStatus: "verified",
      sourceRefs: ["src_wiki_centermass"],
    },
    {
      id: "tammany_lorville",
      name: "Tammany and Sons",
      category: "armor",
      locationId: "lorville",
      subLocation: "CBD promenade",
      products: ["personal_armor"],
      verificationStatus: "medium",
      sourceRefs: ["src_wiki_tammany"],
    },
  ],
  resources: [
    {
      id: "hadanite",
      name: "Hadanite",
      category: "harvestable_mineral",
      miningMethods: ["fps_mining", "roc_mining"],
      knownLocations: ["aberdeen", "daymar"],
      locationNotes: "High-value harvestable mineral deposits found on surface routes.",
      verificationStatus: "verified",
      sourceRefs: ["src_wiki_hadanite"],
    },
    {
      id: "aphorite",
      name: "Aphorite",
      category: "harvestable_mineral",
      miningMethods: ["fps_mining"],
      knownLocations: [],
      locationNotes: "Known gem resource with incomplete location mapping.",
      verificationStatus: "partial",
      sourceRefs: ["src_wiki_aphorite"],
    },
  ],
  armor: [
    {
      id: "macflex_set",
      name: "MacFlex",
      class: "light",
      manufacturer: "Roberts Space Industries",
      recommendedFor: ["fps_mining", "surface_loot"],
      obtainMethods: [{ type: "vendor", storeIds: ["tammany_lorville"] }],
      verificationStatus: "partially_verified",
      sourceRefs: ["src_wiki_macflex", "src_wiki_tammany"],
    },
  ],
  weapons: [
    {
      id: "arclight_pistol",
      name: "Arclight Energy Pistol",
      class: "sidearm",
      damageType: "energy",
      obtainMethods: [{ type: "vendor", storeIds: ["centermass_area18"] }, { type: "loot" }],
      verificationStatus: "general_mapping_only",
      sourceRefs: ["src_wiki_centermass"],
    },
    {
      id: "c54_smg",
      name: "C54 SMG",
      class: "smg",
      damageType: "ballistic",
      obtainMethods: [{ type: "vendor", storeIds: ["centermass_area18"] }, { type: "loot" }],
      verificationStatus: "general_mapping_only",
      sourceRefs: ["src_wiki_centermass"],
    },
  ],
};

const CATEGORY_ORDER = ["all", "resource", "weapon", "armor", "tool"];
const STATUS_ORDER = ["all", "verified", "partial", "partially_verified", "general_mapping_only"];

const state = {
  data: null,
  items: [],
  filteredItems: [],
  search: "",
  category: "all",
  status: "all",
  selectedId: null,
  dataSource: "",
};

const elements = {
  dataStatus: document.getElementById("data-status"),
  refreshData: document.getElementById("refresh-data"),
  totalItems: document.getElementById("stat-total-items"),
  totalLocations: document.getElementById("stat-total-locations"),
  verifiedItems: document.getElementById("stat-verified-items"),
  focusArea: document.getElementById("stat-focus-area"),
  searchInput: document.getElementById("item-search"),
  catalogCount: document.getElementById("catalog-count"),
  categoryFilters: document.getElementById("category-filters"),
  statusFilters: document.getElementById("status-filters"),
  quickIntel: document.getElementById("quick-intel"),
  resultsHeading: document.getElementById("results-heading"),
  resultsSummary: document.getElementById("results-summary"),
  resetFilters: document.getElementById("reset-filters"),
  resultGrid: document.getElementById("result-grid"),
  detailTitle: document.getElementById("detail-title"),
  detailStatus: document.getElementById("detail-status"),
  detailSubtitle: document.getElementById("detail-subtitle"),
  detailDescription: document.getElementById("detail-description"),
  detailLocationsTitle: document.getElementById("detail-locations-title"),
  detailLocations: document.getElementById("detail-locations"),
  detailAcquisitionTitle: document.getElementById("detail-acquisition-title"),
  detailAcquisition: document.getElementById("detail-acquisition"),
  detailSourcesTitle: document.getElementById("detail-sources-title"),
  detailSources: document.getElementById("detail-sources"),
};

init();

function init() {
  attachEvents();
  loadAndRender();
}

function attachEvents() {
  elements.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    applyFilters();
    render();
  });

  elements.resetFilters.addEventListener("click", () => {
    state.search = "";
    state.category = "all";
    state.status = "all";
    elements.searchInput.value = "";
    applyFilters();
    render();
  });

  elements.refreshData.addEventListener("click", () => {
    loadAndRender(true);
  });
}

async function loadAndRender(forceRefresh = false) {
  setLoadingState();

  const rawData = await loadDataset(forceRefresh);
  state.data = rawData;
  state.items = buildCatalog(rawData);
  state.selectedId = state.items[0]?.id ?? null;
  applyFilters();
  render();
}

function setLoadingState() {
  elements.dataStatus.textContent = "Syncing catalog";
  elements.resultsSummary.textContent = "Loading catalog data...";
}

async function loadDataset(forceRefresh) {
  const cacheBust = forceRefresh ? `?t=${Date.now()}` : "";

  try {
    const response = await fetch(`./star-ops-master-data.json${cacheBust}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }

    state.dataSource = "full dataset";
    return await response.json();
  } catch (error) {
    state.dataSource = "embedded fallback";
    return FALLBACK_DATA;
  }
}

function buildCatalog(data) {
  const systemsById = new Map((data.gameSystems || []).map((system) => [system.id, system.name]));
  const locationsById = new Map((data.locations || []).map((location) => [location.id, location]));
  const miningMethodsById = new Map((data.miningMethods || []).map((method) => [method.id, method.name]));
  const storesById = new Map((data.stores || []).map((store) => [store.id, store]));

  const catalog = [
    ...(data.resources || []).map((resource) => transformResource(resource, locationsById, systemsById, miningMethodsById)),
    ...(data.weapons || []).map((weapon) => transformGear(weapon, "weapon", storesById, locationsById, systemsById)),
    ...(data.armor || []).map((armor) => transformGear(armor, "armor", storesById, locationsById, systemsById)),
    ...(data.toolsAndVehicles || []).map((tool) => transformTool(tool)),
  ];

  return catalog.sort((left, right) => left.name.localeCompare(right.name));
}

function transformResource(resource, locationsById, systemsById, miningMethodsById) {
  const knownLocations = (resource.knownLocations || []).map((id) => formatLocationWithSystem(locationsById.get(id), systemsById)).filter(Boolean);
  const miningMethods = (resource.miningMethods || []).map((id) => miningMethodsById.get(id) || humanize(id));

  return {
    id: resource.id,
    name: resource.name,
    category: "resource",
    label: humanize(resource.category || "resource"),
    verificationStatus: resource.verificationStatus || "unknown",
    description: resource.locationNotes || "Mining intel available through the Star Ops dataset.",
    locations: knownLocations,
    acquisition: miningMethods.length ? miningMethods : ["Location data still being mapped"],
    sourceRefs: resource.sourceRefs || [],
    manufacturer: null,
    stats: [
      { label: "Locations", value: String(knownLocations.length || 0) },
      { label: "Methods", value: String(miningMethods.length || 0) },
      { label: "Intel", value: humanize(resource.verificationStatus || "unknown") },
    ],
  };
}

function transformGear(item, category, storesById, locationsById, systemsById) {
  const storeLocations = getStoreLocations(item.obtainMethods, storesById, locationsById, systemsById);
  const acquisition = getObtainMethods(item.obtainMethods);
  const detailBits = [item.class, item.damageType, item.manufacturer].filter(Boolean).map(humanize);

  return {
    id: item.id,
    name: item.name,
    category,
    label: detailBits[0] || humanize(category),
    verificationStatus: item.verificationStatus || "unknown",
    description: detailBits.length ? `${detailBits.join(" • ")}` : `${humanize(category)} entry in the Star Ops catalog.`,
    locations: storeLocations,
    acquisition: acquisition.length ? acquisition : ["Acquisition path not mapped yet"],
    sourceRefs: item.sourceRefs || [],
    manufacturer: item.manufacturer || null,
    stats: [
      { label: "Vendors", value: String(storeLocations.length || 0) },
      { label: "Paths", value: String(acquisition.length || 0) },
      { label: "Intel", value: humanize(item.verificationStatus || "unknown") },
    ],
  };
}

function transformTool(tool) {
  const acquisition = [
    ...(tool.roles || []).map(humanize),
    tool.requiresParentToolId ? `Requires ${humanize(tool.requiresParentToolId.replace(/_/g, " "))}` : null,
  ].filter(Boolean);

  const detailBits = [tool.kind, tool.manufacturer].filter(Boolean).map(humanize);

  return {
    id: tool.id,
    name: tool.name,
    category: "tool",
    label: detailBits[0] || "Tool",
    verificationStatus: tool.verificationStatus || "unknown",
    description: detailBits.length ? `${detailBits.join(" • ")}` : "Support item in the Star Ops catalog.",
    locations: [],
    acquisition: acquisition.length ? acquisition : ["Role mapping pending"],
    sourceRefs: tool.sourceRefs || [],
    manufacturer: tool.manufacturer || null,
    stats: [
      { label: "Roles", value: String((tool.roles || []).length || 0) },
      { label: "Sources", value: String((tool.sourceRefs || []).length || 0) },
      { label: "Intel", value: humanize(tool.verificationStatus || "unknown") },
    ],
  };
}

function getStoreLocations(obtainMethods = [], storesById, locationsById, systemsById) {
  const seen = new Set();
  const labels = [];

  obtainMethods.forEach((method) => {
    if (method.type !== "vendor") {
      return;
    }

    (method.storeIds || []).forEach((storeId) => {
      const store = storesById.get(storeId);
      if (!store) {
        return;
      }

      const location = formatLocationWithSystem(locationsById.get(store.locationId), systemsById);
      const label = [store.name, location].filter(Boolean).join(" — ");
      if (label && !seen.has(label)) {
        seen.add(label);
        labels.push(label);
      }
    });
  });

  return labels;
}

function getObtainMethods(obtainMethods = []) {
  return obtainMethods
    .map((method) => {
      const confidence = method.confidence ? ` (${humanize(method.confidence)})` : "";
      return `${humanize(method.type || "unknown")}${confidence}`;
    })
    .filter(Boolean);
}

function formatLocationWithSystem(location, systemsById) {
  if (!location) {
    return "";
  }

  const systemName = systemsById.get(location.systemId);
  return [location.name, systemName].filter(Boolean).join(", ");
}

function applyFilters() {
  const filtered = state.items.filter((item) => {
    const matchesSearch = !state.search
      || [item.name, item.label, item.description, ...item.locations, ...item.acquisition]
        .join(" ")
        .toLowerCase()
        .includes(state.search);

    const matchesCategory = state.category === "all" || item.category === state.category;
    const matchesStatus = state.status === "all" || item.verificationStatus === state.status;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  state.filteredItems = filtered;

  if (!filtered.some((item) => item.id === state.selectedId)) {
    state.selectedId = filtered[0]?.id ?? null;
  }
}

function render() {
  renderSummary();
  renderFilters();
  renderQuickIntel();
  renderResults();
  renderDetail();
}

function renderSummary() {
  const uniqueLocations = new Set(
    state.items.flatMap((item) => item.locations),
  );
  const verifiedCount = state.items.filter((item) => item.verificationStatus === "verified").length;
  const focusArea = getFocusArea(state.items);

  elements.totalItems.textContent = String(state.items.length);
  elements.totalLocations.textContent = String(uniqueLocations.size);
  elements.verifiedItems.textContent = String(verifiedCount);
  elements.focusArea.textContent = focusArea;
  elements.catalogCount.textContent = `${state.items.length} entries`;
  elements.dataStatus.textContent = `Catalog ready • ${state.dataSource}`;
  elements.resultsHeading.textContent = state.category === "all" ? "Full catalog sweep" : `${humanize(state.category)} sweep`;
  elements.resultsSummary.textContent = `${state.filteredItems.length} of ${state.items.length} entries shown • ${state.data?.meta?.gameVersionTarget || "dataset ready"}`;
}

function renderFilters() {
  renderChipGroup(elements.categoryFilters, CATEGORY_ORDER, state.category, (value) => {
    state.category = value;
    applyFilters();
    render();
  }, getCategoryLabel);

  renderChipGroup(elements.statusFilters, STATUS_ORDER, state.status, (value) => {
    state.status = value;
    applyFilters();
    render();
  }, getStatusLabel);
}

function renderChipGroup(container, values, activeValue, onSelect, formatter) {
  container.innerHTML = "";

  values.forEach((value) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chip${value === activeValue ? " active" : ""}`;
    button.setAttribute("aria-pressed", value === activeValue ? "true" : "false");
    button.textContent = formatter(value);
    button.addEventListener("click", () => onSelect(value));
    container.appendChild(button);
  });
}

function renderQuickIntel() {
  const selectedItem = getSelectedItem();
  const topVerified = state.items.filter((item) => item.verificationStatus === "verified").length;

  elements.quickIntel.innerHTML = [
    createIntelRow("Dataset", state.data?.meta?.datasetName || "Unavailable"),
    createIntelRow("Generated", state.data?.meta?.generatedOn || "Unknown"),
    createIntelRow("Verified entries", String(topVerified)),
    createIntelRow("Selected", selectedItem?.name || "None"),
  ].join("");
}

function renderResults() {
  elements.resultGrid.innerHTML = "";

  if (!state.filteredItems.length) {
    const emptyCard = document.createElement("article");
    emptyCard.className = "panel result-card empty-state";
    emptyCard.innerHTML = `
      <div class="result-meta">
        <span class="tag">No matches</span>
        <span class="muted">Adjust the search or filters</span>
      </div>
      <h4>Nothing matches the current sweep.</h4>
      <p class="muted">Try clearing the search box or selecting a broader verification range.</p>
    `;
    elements.resultGrid.appendChild(emptyCard);
    return;
  }

  state.filteredItems.forEach((item, index) => {
    const card = document.createElement("article");
    const isActive = item.id === state.selectedId;
    card.className = `panel result-card${index === 0 ? " featured" : ""}${isActive ? " active" : ""}`;
    card.tabIndex = 0;
    card.innerHTML = `
      <div class="result-meta">
        <span class="tag">${humanize(item.category)}</span>
        <span class="muted">${humanize(item.verificationStatus)}</span>
      </div>
      <h4>${item.name}</h4>
      <p class="muted">${item.description}</p>
      <dl class="metrics">
        ${item.stats
          .map(
            (stat) => `
              <div>
                <dt>${stat.label}</dt>
                <dd>${stat.value}</dd>
              </div>
            `,
          )
          .join("")}
      </dl>
    `;
    card.addEventListener("click", () => {
      state.selectedId = item.id;
      render();
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        state.selectedId = item.id;
        render();
      }
    });
    elements.resultGrid.appendChild(card);
  });
}

function renderDetail() {
  const item = getSelectedItem();

  if (!item) {
    elements.detailTitle.textContent = "Awaiting item lock";
    elements.detailStatus.textContent = "No selection";
    elements.detailSubtitle.textContent = "Choose a card to inspect its intel.";
    elements.detailDescription.textContent = "";
    setDetailList(elements.detailLocations, ["No item selected"]);
    setDetailList(elements.detailAcquisition, ["No item selected"]);
    setDetailList(elements.detailSources, ["No item selected"]);
    elements.detailLocationsTitle.textContent = "No locations loaded";
    elements.detailAcquisitionTitle.textContent = "No acquisition data";
    elements.detailSourcesTitle.textContent = "No source refs";
    return;
  }

  elements.detailTitle.textContent = item.name;
  elements.detailStatus.textContent = humanize(item.verificationStatus);
  elements.detailSubtitle.textContent = item.label;
  elements.detailDescription.textContent = item.description;
  elements.detailLocationsTitle.textContent = item.locations.length ? `${item.locations.length} mapped location${item.locations.length === 1 ? "" : "s"}` : "No mapped locations yet";
  elements.detailAcquisitionTitle.textContent = `${item.acquisition.length} intel channel${item.acquisition.length === 1 ? "" : "s"}`;
  elements.detailSourcesTitle.textContent = `${item.sourceRefs.length} source ref${item.sourceRefs.length === 1 ? "" : "s"}`;

  setDetailList(elements.detailLocations, item.locations.length ? item.locations : ["No location data in the current dataset"]);
  setDetailList(elements.detailAcquisition, item.acquisition.length ? item.acquisition : ["No acquisition data in the current dataset"]);
  setDetailList(elements.detailSources, item.sourceRefs.length ? item.sourceRefs : ["No source refs attached"]);
}

function setDetailList(container, values) {
  container.innerHTML = values.map((value) => `<li>${value}</li>`).join("");
}

function getSelectedItem() {
  return state.filteredItems.find((item) => item.id === state.selectedId) || state.items.find((item) => item.id === state.selectedId) || null;
}

function getFocusArea(items) {
  const systems = new Map();

  items.forEach((item) => {
    item.locations.forEach((locationLabel) => {
      const parts = locationLabel.split(", ");
      const system = parts[parts.length - 1];
      systems.set(system, (systems.get(system) || 0) + 1);
    });
  });

  const top = [...systems.entries()].sort((left, right) => right[1] - left[1])[0];
  return top ? top[0] : "Field intel";
}

function getCategoryLabel(value) {
  if (value === "all") {
    return "All";
  }

  const count = state.items.filter((item) => item.category === value).length;
  return `${humanize(value)} (${count})`;
}

function getStatusLabel(value) {
  if (value === "all") {
    return "All";
  }

  const count = state.items.filter((item) => item.verificationStatus === value).length;
  return `${humanize(value)} (${count})`;
}

function createIntelRow(label, value) {
  return `
    <div>
      <span class="muted">${label}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function humanize(value) {
  return String(value || "unknown")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
