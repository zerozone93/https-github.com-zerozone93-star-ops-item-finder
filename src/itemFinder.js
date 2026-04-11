const { items } = require('./items');

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function filterItems({ query = '', category = '', location = '', limit } = {}) {
  const normalizedQuery = normalizeText(query);
  const normalizedCategory = normalizeText(category);
  const normalizedLocation = normalizeText(location);

  const matches = items.filter((item) => {
    const matchesQuery =
      !normalizedQuery ||
      normalizeText(item.name).includes(normalizedQuery) ||
      normalizeText(item.category).includes(normalizedQuery) ||
      normalizeText(item.location).includes(normalizedQuery);

    const matchesCategory =
      !normalizedCategory || normalizeText(item.category) === normalizedCategory;
    const matchesLocation =
      !normalizedLocation || normalizeText(item.location) === normalizedLocation;

    return matchesQuery && matchesCategory && matchesLocation;
  });

  if (typeof limit === 'number' && Number.isFinite(limit) && limit >= 0) {
    return matches.slice(0, limit);
  }

  return matches;
}

module.exports = {
  filterItems,
  normalizeText,
};
