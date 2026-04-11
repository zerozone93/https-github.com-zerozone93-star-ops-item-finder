(function () {
  const state = {
    appData: null,
    catalog: null,
    sources: [],
    filters: {
      query: "",
      category: "all",
      services: new Set(["all"]),
    },
    selectedItemId: null,
    selectedDetails: {
      locations: [],
      components: [],
      crafting: [],
      mining: [],
    },
  };

  const categoryMap = {
    all: null,
    weapons: new Set(["weapon", "attachment"]),
    armor: new Set(["armor"]),
    medical: new Set(["medical"]),
    components: new Set(["ship-component"]),
  };

  const elements = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function formatCurrency(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "N/A";
    }

    return `${Number(value).toLocaleString()} aUEC`;
  }

  function formatCategory(value) {
    return String(value || "unknown")
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  function createEmptyState(title, description) {
    const wrapper = document.createElement("div");
    wrapper.className = "empty-state";

    const heading = document.createElement("strong");
    heading.textContent = title;
    wrapper.appendChild(heading);

    const text = document.createElement("p");
    text.className = "muted";
    text.textContent = description;
    wrapper.appendChild(text);

    return wrapper;
  }

  async function fetchJson(url) {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Request failed for ${url}`);
    }

    return response.json();
  }

  function getAllServices() {
    if (!state.catalog) {
      return [];
    }

    return [...new Set(state.catalog.locations.flatMap((location) => location.services || []))].sort();
  }

  function getSelectedItem() {
    return state.catalog?.items.find((item) => item.id === state.selectedItemId) || null;
  }

  function getFilteredItems() {
    if (!state.catalog) {
      return [];
    }

    let items = [...state.catalog.items];
    const allowedCategories = categoryMap[state.filters.category];

    if (allowedCategories) {
      items = items.filter((item) => allowedCategories.has(item.category));
    }

    if (state.filters.query.trim()) {
      const query = state.filters.query.trim().toLowerCase();
      items = items.filter((item) =>
        [item.name, item.category, item.subcategory, item.manufacturer, ...(item.tags || [])]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query)),
      );
    }

    if (!state.filters.services.has("all")) {
      const allowedItemIds = new Set(
        state.catalog.locations
          .filter((location) => location.services?.some((service) => state.filters.services.has(service)))
          .flatMap((location) => (location.inventories || []).map((inventory) => inventory.itemId)),
      );

      items = items.filter((item) => allowedItemIds.has(item.id));
    }

    return items.sort((left, right) => {
      const leftLocations = getLocationCountForItem(left.id);
      const rightLocations = getLocationCountForItem(right.id);

      if (rightLocations !== leftLocations) {
        return rightLocations - leftLocations;
      }

      return left.name.localeCompare(right.name);
    });
  }

  function getLocationCountForItem(itemId) {
    return state.catalog.locations.filter((location) =>
      (location.inventories || []).some((inventory) => inventory.itemId === itemId),
    ).length;
  }

  function getBestBuyForItem(itemId) {
    const matches = state.catalog.locations.flatMap((location) =>
      (location.inventories || [])
        .filter((inventory) => inventory.itemId === itemId && inventory.buyPrice !== null)
        .map((inventory) => ({ location, inventory })),
    );

    if (!matches.length) {
      return null;
    }

    return matches.sort((left, right) => left.inventory.buyPrice - right.inventory.buyPrice)[0];
  }

  function getBestSellForItem(itemId) {
    const matches = state.catalog.locations.flatMap((location) =>
      (location.inventories || [])
        .filter((inventory) => inventory.itemId === itemId && inventory.sellPrice !== null)
        .map((inventory) => ({ location, inventory })),
    );

    if (!matches.length) {
      return null;
    }

    return matches.sort((left, right) => right.inventory.sellPrice - left.inventory.sellPrice)[0];
  }

  function renderHeroStats() {
    const { items, locations } = state.catalog;
    const bestMargin = items.reduce((currentBest, item) => {
      const buy = getBestBuyForItem(item.id);
      const sell = getBestSellForItem(item.id);

      if (!buy || !sell || !buy.inventory.buyPrice) {
        return currentBest;
      }

      const margin = Math.round(((sell.inventory.sellPrice - buy.inventory.buyPrice) / buy.inventory.buyPrice) * 100);
      return margin > currentBest ? margin : currentBest;
    }, 0);

    elements.heroStats.innerHTML = "";

    [
      { label: "Tracked items", value: items.length },
      { label: "Stations online", value: locations.length },
      { label: "Best margin", value: `${bestMargin >= 0 ? "+" : ""}${bestMargin}%`, accent: true },
    ].forEach((entry) => {
      const card = document.createElement("div");
      card.className = `stat-card${entry.accent ? " accent" : ""}`;
      card.innerHTML = `<span class="stat-label">${entry.label}</span><strong>${entry.value}</strong>`;
      elements.heroStats.appendChild(card);
    });
  }

  function renderPriorityIntel() {
    const cheapest = state.catalog.items
      .map((item) => ({ item, match: getBestBuyForItem(item.id) }))
      .filter((entry) => entry.match)
      .sort((left, right) => left.match.inventory.buyPrice - right.match.inventory.buyPrice)[0];

    const fastestPickup = state.catalog.locations
      .find((location) => location.services?.includes("medical")) || state.catalog.locations[0];

    const highestCoverage = state.catalog.items
      .map((item) => ({ item, locations: getLocationCountForItem(item.id) }))
      .sort((left, right) => right.locations - left.locations)[0];

    const intel = [
      cheapest
        ? {
            label: "Cheapest buy",
            value: `${cheapest.item.name} @ ${cheapest.match.location.name}`,
          }
        : null,
      fastestPickup
        ? {
            label: "Fastest pickup",
            value: fastestPickup.name,
          }
        : null,
      highestCoverage
        ? {
            label: "Most available",
            value: `${highestCoverage.item.name} • ${highestCoverage.locations} shops`,
          }
        : null,
    ].filter(Boolean);

    elements.priorityIntel.innerHTML = "";
    intel.forEach((entry) => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = `<span class="muted">${entry.label}</span><strong>${entry.value}</strong>`;
      elements.priorityIntel.appendChild(wrapper);
    });
  }

  function renderServiceFilters() {
    const services = getAllServices();
    elements.serviceFilters.innerHTML = "";

    const allLabel = document.createElement("label");
    allLabel.className = "control-option";
    allLabel.innerHTML = `<input type="checkbox" value="all" ${state.filters.services.has("all") ? "checked" : ""} /><span>All services</span>`;
    elements.serviceFilters.appendChild(allLabel);

    services.forEach((service) => {
      const label = document.createElement("label");
      label.className = "control-option";
      label.innerHTML = `<input type="checkbox" value="${service}" ${state.filters.services.has(service) ? "checked" : ""} /><span>${formatCategory(service)}</span>`;
      elements.serviceFilters.appendChild(label);
    });
  }

  function renderResults() {
    const filteredItems = getFilteredItems();
    const selectedItem = getSelectedItem();

    elements.resultsTitle.textContent = filteredItems.length
      ? `${filteredItems.length} catalog result${filteredItems.length === 1 ? "" : "s"}`
      : "No matching items";
    elements.resultsSummary.textContent = selectedItem
      ? `Selected: ${selectedItem.name}`
      : "Adjust filters or sync the test environment.";

    elements.resultGrid.innerHTML = "";

    if (!filteredItems.length) {
      elements.resultGrid.appendChild(
        createEmptyState(
          "No items match these filters",
          "Try a different search term, category, or service filter.",
        ),
      );
      return;
    }

    filteredItems.forEach((item, index) => {
      const bestBuy = getBestBuyForItem(item.id);
      const button = document.createElement("button");
      const isSelected = item.id === state.selectedItemId;
      button.className = `result-button${index === 0 ? " featured" : ""}${isSelected ? " is-selected" : ""}`;
      button.type = "button";
      button.dataset.itemId = item.id;

      const locationsCount = getLocationCountForItem(item.id);
      const component = state.catalog.components.find((entry) => entry.itemId === item.id);
      const recipeCount = state.catalog.crafting.recipes.filter((entry) => entry.outputItemId === item.id).length;

      button.innerHTML = `
        <div class="result-meta">
          <span class="tag">${formatCategory(item.category)}</span>
          <span class="muted">${item.manufacturer || item.subcategory || "Unlisted manufacturer"}</span>
        </div>
        <h4>${item.name}</h4>
        <p class="muted">${item.description || "No description available."}</p>
        <dl class="metrics">
          <div>
            <dt>Best buy</dt>
            <dd>${bestBuy ? formatCurrency(bestBuy.inventory.buyPrice) : "N/A"}</dd>
          </div>
          <div>
            <dt>Locations</dt>
            <dd>${locationsCount}</dd>
          </div>
          <div>
            <dt>Ops data</dt>
            <dd>${component ? "Component" : recipeCount ? "Crafting" : item.category === "mining-resource" ? "Mining" : "Catalog"}</dd>
          </div>
        </dl>
      `;

      button.addEventListener("click", () => {
        selectItem(item.id).catch(handleError);
      });

      elements.resultGrid.appendChild(button);
    });
  }

  function renderSources() {
    elements.sourceList.innerHTML = "";

    if (!state.sources.length) {
      elements.sourceList.appendChild(
        createEmptyState("No connectors configured", "The local catalog is the only active source."),
      );
      return;
    }

    state.sources.forEach((source) => {
      const item = document.createElement("div");
      item.className = "stack-item";
      item.innerHTML = `
        <strong>${source.name}</strong>
        <p class="${source.status === "error" ? "source-error" : "source-ok"}">${formatCategory(source.status)}</p>
        <p class="muted">${source.detail || "No connector details provided."}</p>
      `;
      elements.sourceList.appendChild(item);
    });
  }

  function renderDetailBlocks(item, locations, components, crafting, mining) {
    const bestBuy = locations
      .flatMap((location) =>
        (location.inventories || [])
          .filter((inventory) => inventory.itemId === item.id && inventory.buyPrice !== null)
          .map((inventory) => ({ location, inventory })),
      )
      .sort((left, right) => left.inventory.buyPrice - right.inventory.buyPrice)[0];

    const bestSell = locations
      .flatMap((location) =>
        (location.inventories || [])
          .filter((inventory) => inventory.itemId === item.id && inventory.sellPrice !== null)
          .map((inventory) => ({ location, inventory })),
      )
      .sort((left, right) => right.inventory.sellPrice - left.inventory.sellPrice)[0];

    const primaryNote = components[0]
      ? `${formatCategory(components[0].type)} • size ${components[0].size || "?"} • grade ${components[0].grade || "?"}`
      : crafting[0]
        ? `${crafting[0].inputs.length} material input${crafting[0].inputs.length === 1 ? "" : "s"}`
        : mining[0]
          ? `${mining[0].locations.length} extraction zone${mining[0].locations.length === 1 ? "" : "s"}`
          : `${item.tags?.slice(0, 2).join(" • ") || "Catalog reference item"}`;

    elements.detailGrid.innerHTML = "";

    [
      {
        label: "Best local buy",
        title: bestBuy ? bestBuy.location.name : "No active listing",
        description: bestBuy
          ? `${formatCurrency(bestBuy.inventory.buyPrice)} • ${bestBuy.inventory.stock ?? "?"} units`
          : "No buy listings are currently available for this item.",
      },
      {
        label: "Recommended resale",
        title: bestSell ? bestSell.location.name : "No resale signal",
        description: bestSell
          ? `${formatCurrency(bestSell.inventory.sellPrice)} projected resale`
          : "No sell-price data is currently available.",
      },
      {
        label: "Operational note",
        title: formatCategory(item.category),
        description: primaryNote,
      },
    ].forEach((block) => {
      const wrapper = document.createElement("div");
      wrapper.className = "detail-block";
      wrapper.innerHTML = `
        <span class="section-label">${block.label}</span>
        <strong>${block.title}</strong>
        <p class="muted">${block.description}</p>
      `;
      elements.detailGrid.appendChild(wrapper);
    });
  }

  function renderLocationList(item, locations) {
    elements.locationList.innerHTML = "";

    if (!locations.length) {
      elements.locationList.appendChild(
        createEmptyState("No location snapshots", "No shop or station inventory is currently linked to this item."),
      );
      return;
    }

    locations.forEach((location) => {
      const inventory = (location.inventories || []).find((entry) => entry.itemId === item.id);
      const card = document.createElement("div");
      card.className = "stack-item";
      card.innerHTML = `
        <strong>${location.name}</strong>
        <p class="muted">${location.system || "Unknown system"} • ${formatCategory(location.kind)}</p>
        <p>${inventory ? `${formatCurrency(inventory.buyPrice)} • stock ${inventory.stock ?? "?"}` : "Inventory snapshot unavailable."}</p>
      `;
      elements.locationList.appendChild(card);
    });
  }

  function renderComponentList(components) {
    elements.componentList.innerHTML = "";

    if (!components.length) {
      elements.componentList.appendChild(
        createEmptyState("No component telemetry", "Select a ship component to inspect detailed specs."),
      );
      return;
    }

    components.forEach((component) => {
      const card = document.createElement("div");
      card.className = "stack-item";
      card.innerHTML = `
        <strong>${component.name}</strong>
        <p class="muted">${formatCategory(component.type)} • size ${component.size || "?"} • grade ${component.grade || "?"}</p>
        <p>Power draw ${component.powerDraw ?? "?"} • cooling ${component.coolingRate ?? "?"} • durability ${component.durability ?? "?"}</p>
      `;
      elements.componentList.appendChild(card);
    });
  }

  function renderCraftingList(crafting) {
    elements.craftingList.innerHTML = "";

    if (!crafting.length) {
      elements.craftingList.appendChild(
        createEmptyState("No crafting recipe", "No blueprint-style output chain is stored for this item."),
      );
      return;
    }

    crafting.forEach((recipe) => {
      const inputs = recipe.inputs.map((input) => {
        const item = state.catalog.items.find((entry) => entry.id === input.itemId);
        return `${input.amount}× ${item ? item.name : input.itemId}`;
      });

      const card = document.createElement("div");
      card.className = "stack-item";
      card.innerHTML = `
        <strong>${recipe.facility || "Unknown facility"}</strong>
        <p class="muted">Output ${recipe.outputAmount} item${recipe.outputAmount === 1 ? "" : "s"}</p>
        <p>${inputs.join(" • ")}</p>
      `;
      elements.craftingList.appendChild(card);
    });
  }

  function renderMiningList(item, mining, crafting) {
    elements.miningList.innerHTML = "";

    const derivedMining = mining.length
      ? mining
      : crafting.flatMap((recipe) =>
          recipe.inputs
            .map((input) => state.catalog.mining.resources.find((resource) => resource.itemId === input.itemId))
            .filter(Boolean),
        );

    if (!derivedMining.length) {
      elements.miningList.appendChild(
        createEmptyState("No mining intel", "No mining routes or refinery data are linked to this item."),
      );
      return;
    }

    derivedMining.forEach((resource) => {
      const locationText = resource.locations
        .map((location) => location.region || location.locationId || "Unknown region")
        .join(" • ");
      const refineryText = resource.refinery
        .map((entry) => `${entry.method} ${entry.yieldPercent || "?"}%`)
        .join(" • ");

      const card = document.createElement("div");
      card.className = "stack-item";
      card.innerHTML = `
        <strong>${resource.name || item.name}</strong>
        <p class="muted">${locationText || "No tracked extraction zones."}</p>
        <p>${refineryText || "No refinery recommendations tracked."}</p>
      `;
      elements.miningList.appendChild(card);
    });
  }

  function renderSelectedItem() {
    const item = getSelectedItem();

    if (!item) {
      elements.selectedItemName.textContent = "Choose an item";
      elements.selectedItemDescription.textContent = "Select a result to inspect live catalog behavior.";
      elements.selectedItemStatus.textContent = "Awaiting selection";
      elements.detailGrid.innerHTML = "";
      elements.locationList.innerHTML = "";
      elements.componentList.innerHTML = "";
      elements.craftingList.innerHTML = "";
      elements.miningList.innerHTML = "";
      return;
    }

    const { locations, components, crafting, mining } = state.selectedDetails;
    const locationCount = locations.length;

    elements.selectedItemName.textContent = item.name;
    elements.selectedItemDescription.textContent = item.description || "No item description available.";
    elements.selectedItemStatus.textContent = `${locationCount} location${locationCount === 1 ? "" : "s"} reporting`;

    renderDetailBlocks(item, locations, components, crafting, mining);
    renderLocationList(item, locations);
    renderComponentList(components);
    renderCraftingList(crafting);
    renderMiningList(item, mining, crafting);
  }

  async function selectItem(itemId) {
    state.selectedItemId = itemId;
    renderResults();

    const item = getSelectedItem();

    if (!item) {
      return;
    }

    elements.selectedItemName.textContent = item.name;
    elements.selectedItemDescription.textContent = "Loading item telemetry…";
    elements.selectedItemStatus.textContent = "Syncing";

    const [locationsResponse, craftingResponse, miningResponse, componentsResponse] = await Promise.all([
      fetchJson(`/api/locations?itemId=${encodeURIComponent(itemId)}`),
      fetchJson(`/api/crafting?outputItemId=${encodeURIComponent(itemId)}`),
      fetchJson(`/api/mining?itemId=${encodeURIComponent(itemId)}`),
      item.category === "ship-component"
        ? fetchJson(`/api/components?itemId=${encodeURIComponent(itemId)}`)
        : Promise.resolve({ data: [] }),
    ]);

    state.selectedDetails = {
      locations: locationsResponse.data || [],
      crafting: craftingResponse.data || [],
      mining: miningResponse.data || [],
      components: componentsResponse.data || [],
    };

    renderSelectedItem();
  }

  function applyAppData() {
    if (!state.appData) {
      return;
    }

    elements.networkName.textContent = state.appData.app.network;
    elements.appName.textContent = state.appData.app.name;
    elements.liveStatus.textContent = "Test environment ready";
    elements.syncButton.textContent = state.appData.app.primaryAction.label;
    elements.heroEyebrow.textContent = "Test environment";
    elements.heroTitle.textContent = state.appData.app.tagline;
    elements.heroDescription.textContent =
      "This local environment is wired to the normalized APIs so you can validate real interactions before any deployment.";
    elements.focusSelected.textContent = state.appData.results.primaryAction.label;
  }

  function setFeedback(message, stateName) {
    elements.feedbackBanner.textContent = message;
    if (stateName) {
      elements.feedbackBanner.dataset.state = stateName;
    } else {
      delete elements.feedbackBanner.dataset.state;
    }
  }

  async function loadApplication() {
    setFeedback("Loading catalog and connector status…");
    elements.liveStatus.textContent = "Syncing catalog";

    const [appData, catalog, sourcesPayload] = await Promise.all([
      fetchJson("/api/app-data"),
      fetchJson("/api/catalog"),
      fetchJson("/api/sources"),
    ]);

    state.appData = appData;
    state.catalog = catalog;
    state.sources = sourcesPayload.data || [];

    applyAppData();
    renderHeroStats();
    renderPriorityIntel();
    renderServiceFilters();
    renderSources();
    renderResults();

    const filteredItems = getFilteredItems();
    const nextSelection =
      filteredItems.find((item) => item.id === state.selectedItemId)?.id ||
      filteredItems[0]?.id ||
      null;

    if (nextSelection) {
      await selectItem(nextSelection);
    } else {
      state.selectedItemId = null;
      renderSelectedItem();
    }

    elements.liveStatus.textContent = "Catalog synced";
    setFeedback("Star Ops test environment loaded. Search, filter, and inspect item telemetry.");
  }

  function handleError(error) {
    console.error(error);
    elements.liveStatus.textContent = "Sync failed";
    setFeedback("The test environment could not load catalog data. Try syncing again.", "error");
  }

  function handleServiceFilterChange(input) {
    if (input.value === "all") {
      state.filters.services = new Set(["all"]);
      renderServiceFilters();
      return;
    }

    state.filters.services.delete("all");

    if (input.checked) {
      state.filters.services.add(input.value);
    } else {
      state.filters.services.delete(input.value);
    }

    if (!state.filters.services.size) {
      state.filters.services.add("all");
    }

    renderServiceFilters();
  }

  function registerEvents() {
    elements.searchInput.addEventListener("input", () => {
      state.filters.query = elements.searchInput.value;
      renderResults();

      const filteredItems = getFilteredItems();
      if (filteredItems.length && !filteredItems.some((item) => item.id === state.selectedItemId)) {
        selectItem(filteredItems[0].id).catch(handleError);
        return;
      }

      if (!filteredItems.length) {
        state.selectedItemId = null;
        state.selectedDetails = { locations: [], components: [], crafting: [], mining: [] };
        renderSelectedItem();
      }
    });

    elements.categoryFilters.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-category]");

      if (!button) {
        return;
      }

      state.filters.category = button.dataset.category;
      [...elements.categoryFilters.querySelectorAll("button")].forEach((chip) => {
        chip.classList.toggle("active", chip === button);
        chip.setAttribute("aria-pressed", chip === button ? "true" : "false");
      });

      renderResults();

      const filteredItems = getFilteredItems();
      if (filteredItems.length && !filteredItems.some((item) => item.id === state.selectedItemId)) {
        selectItem(filteredItems[0].id).catch(handleError);
      }
    });

    elements.serviceFilters.addEventListener("change", (event) => {
      const input = event.target.closest("input[type='checkbox']");

      if (!input) {
        return;
      }

      handleServiceFilterChange(input);
      renderResults();

      const filteredItems = getFilteredItems();
      if (filteredItems.length && !filteredItems.some((item) => item.id === state.selectedItemId)) {
        selectItem(filteredItems[0].id).catch(handleError);
      }
    });

    elements.syncButton.addEventListener("click", () => {
      loadApplication().catch(handleError);
    });

    elements.focusSelected.addEventListener("click", () => {
      elements.detailCard.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function cacheElements() {
    elements.appName = byId("app-name");
    elements.categoryFilters = byId("category-filters");
    elements.componentList = byId("component-list");
    elements.craftingList = byId("crafting-list");
    elements.detailCard = byId("detail-card");
    elements.detailGrid = byId("detail-grid");
    elements.feedbackBanner = byId("feedback-banner");
    elements.focusSelected = byId("focus-selected");
    elements.heroDescription = byId("hero-description");
    elements.heroEyebrow = byId("hero-eyebrow");
    elements.heroStats = byId("hero-stats");
    elements.heroTitle = byId("hero-title");
    elements.itemSearch = byId("item-search");
    elements.liveStatus = byId("live-status");
    elements.locationList = byId("location-list");
    elements.miningList = byId("mining-list");
    elements.networkName = byId("network-name");
    elements.priorityIntel = byId("priority-intel");
    elements.resultGrid = byId("result-grid");
    elements.resultsSummary = byId("results-summary");
    elements.resultsTitle = byId("results-title");
    elements.searchInput = byId("item-search");
    elements.selectedItemDescription = byId("selected-item-description");
    elements.selectedItemName = byId("selected-item-name");
    elements.selectedItemStatus = byId("selected-item-status");
    elements.serviceFilters = byId("service-filters");
    elements.sourceList = byId("source-list");
    elements.syncButton = byId("sync-button");
  }

  document.addEventListener("DOMContentLoaded", () => {
    cacheElements();
    registerEvents();
    loadApplication().catch(handleError);
  });
})();
