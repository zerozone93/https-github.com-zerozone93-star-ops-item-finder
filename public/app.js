const form = document.getElementById('search-form');
const queryInput = document.getElementById('query');
const categorySelect = document.getElementById('category');
const locationSelect = document.getElementById('location');
const resultsList = document.getElementById('results-list');
const resultsCount = document.getElementById('results-count');

function renderItems(items) {
  resultsList.innerHTML = '';
  resultsCount.textContent = `${items.length} item${items.length === 1 ? '' : 's'} found`;

  if (!items.length) {
    const emptyState = document.createElement('li');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'No items matched your search.';
    resultsList.appendChild(emptyState);
    return;
  }

  items.forEach((item) => {
    const listItem = document.createElement('li');
    listItem.className = 'item-card';
    listItem.innerHTML = `
      <h3>${item.name}</h3>
      <p><strong>Category:</strong> ${item.category}</p>
      <p><strong>Location:</strong> ${item.location}</p>
      <p><strong>Price:</strong> ${item.price} aUEC</p>
    `;
    resultsList.appendChild(listItem);
  });
}

async function loadItems() {
  const params = new URLSearchParams({
    q: queryInput.value,
    category: categorySelect.value,
    location: locationSelect.value,
  });

  const response = await fetch(`/api/items?${params.toString()}`);
  const data = await response.json();
  renderItems(data.items);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  loadItems();
});

loadItems();
