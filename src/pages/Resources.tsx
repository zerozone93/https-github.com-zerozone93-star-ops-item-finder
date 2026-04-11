import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import ItemCard from '../components/ItemCard';
import RarityBadge from '../components/RarityBadge';
import TypeBadge from '../components/TypeBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { searchItems, formatRarity } from '../utils/dataUtils';

const FILTER_GROUPS = [
  {
    key: 'type',
    label: 'Type',
    options: [
      { value: 'gas', label: 'Gas' },
      { value: 'mineral', label: 'Mineral' },
      { value: 'metal', label: 'Metal' },
      { value: 'organic', label: 'Organic' },
      { value: 'quantum', label: 'Quantum' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    key: 'rarity',
    label: 'Rarity',
    options: [
      { value: 'common', label: 'Common' },
      { value: 'uncommon', label: 'Uncommon' },
      { value: 'rare', label: 'Rare' },
      { value: 'very_rare', label: 'Very Rare' },
    ],
  },
  {
    key: 'miningMethod',
    label: 'Mining Method',
    options: [
      { value: 'fps-mining', label: 'FPS Mining' },
      { value: 'roc-mining', label: 'ROC Mining' },
      { value: 'ship-mining', label: 'Ship Mining' },
    ],
  },
];

export default function Resources() {
  const { data, loading, error } = useData();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [sort, setSort] = useState<'name' | 'rarity'>('name');
  const navigate = useNavigate();

  if (loading) return <LoadingSpinner />;
  if (error || !data) return <EmptyState icon="⚠️" title="Error" message={error ?? 'Failed to load data'} />;

  const RARITY_ORDER = { very_rare: 0, rare: 1, uncommon: 2, common: 3 };

  const filtered = useMemo(() => {
    let list = searchItems(data.resources, query, ['name', 'description']);
    if (filters.type?.length) list = list.filter(r => filters.type.includes(r.type));
    if (filters.rarity?.length) list = list.filter(r => filters.rarity.includes(r.rarity));
    if (filters.miningMethod?.length) list = list.filter(r => r.miningMethodIds.some(m => filters.miningMethod.includes(m)));
    return [...list].sort((a, b) => {
      if (sort === 'rarity') return (RARITY_ORDER[a.rarity] ?? 9) - (RARITY_ORDER[b.rarity] ?? 9);
      return a.name.localeCompare(b.name);
    });
  }, [data.resources, query, filters, sort]);

  function setFilter(key: string, values: string[]) {
    setFilters(f => ({ ...f, [key]: values }));
  }

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Resources</h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <SearchBar placeholder="Search resources..." value={query} onChange={setQuery} />
          <select
            className="input"
            style={{ width: 'auto', minWidth: 130 }}
            value={sort}
            onChange={e => setSort(e.target.value as 'name' | 'rarity')}
          >
            <option value="name">Sort: Name</option>
            <option value="rarity">Sort: Rarity</option>
          </select>
        </div>
      </div>

      <FilterPanel
        groups={FILTER_GROUPS}
        active={filters}
        onChange={setFilter}
        onClear={() => setFilters({})}
      />

      <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
        Showing {filtered.length} of {data.resources.length} resources
      </p>

      {filtered.length === 0 ? (
        <EmptyState message="No resources match your filters." />
      ) : (
        <div className="grid-cards">
          {filtered.map((res) => (
            <ItemCard
              key={res.id}
              title={res.name}
              description={res.description}
              badges={
                <>
                  <TypeBadge type={res.type} />
                  <RarityBadge rarity={res.rarity} />
                </>
              }
              footer={
                <div className="flex-wrap-gap">
                  <span className="tag">📍 {res.locationIds.length} location{res.locationIds.length !== 1 ? 's' : ''}</span>
                  <span className="tag">⛏️ {res.miningMethodIds.length} method{res.miningMethodIds.length !== 1 ? 's' : ''}</span>
                  {res.recipeIds.length > 0 && <span className="tag">🔧 {res.recipeIds.length} recipe{res.recipeIds.length !== 1 ? 's' : ''}</span>}
                </div>
              }
              onClick={() => navigate(`/item/resource/${res.id}`)}
            />
          ))}
        </div>
      )}

      {/* Rarity Legend */}
      <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rarity Guide</div>
        <div className="flex-wrap-gap">
          {(['common', 'uncommon', 'rare', 'very_rare'] as const).map(r => (
            <span key={r}><RarityBadge rarity={r} /> {formatRarity(r)}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
