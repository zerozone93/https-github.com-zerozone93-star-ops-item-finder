import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import ItemCard from '../components/ItemCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { searchItems, formatObtainMethod } from '../utils/dataUtils';

const WEAPON_FILTERS = [
  {
    key: 'type',
    label: 'Type',
    options: [
      { value: 'rifle', label: 'Rifle' },
      { value: 'pistol', label: 'Pistol' },
      { value: 'shotgun', label: 'Shotgun' },
      { value: 'smg', label: 'SMG' },
      { value: 'sniper', label: 'Sniper' },
      { value: 'plasma', label: 'Plasma' },
      { value: 'laser', label: 'Laser' },
      { value: 'heavy', label: 'Heavy' },
      { value: 'melee', label: 'Melee' },
    ],
  },
  {
    key: 'class',
    label: 'Class',
    options: [
      { value: 'fps', label: 'FPS' },
      { value: 'ship_weapon', label: 'Ship Weapon' },
    ],
  },
];

const ARMOR_FILTERS = [
  {
    key: 'type',
    label: 'Slot',
    options: [
      { value: 'helmet', label: 'Helmet' },
      { value: 'chest', label: 'Chest' },
      { value: 'arms', label: 'Arms' },
      { value: 'legs', label: 'Legs' },
      { value: 'undersuit', label: 'Undersuit' },
      { value: 'full_set', label: 'Full Set' },
    ],
  },
  {
    key: 'class',
    label: 'Class',
    options: [
      { value: 'light', label: 'Light' },
      { value: 'medium', label: 'Medium' },
      { value: 'heavy', label: 'Heavy' },
    ],
  },
];

export default function WeaponsArmor() {
  const { data, loading, error } = useData();
  const [tab, setTab] = useState<'weapons' | 'armor'>('weapons');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const navigate = useNavigate();

  if (loading) return <LoadingSpinner />;
  if (error || !data) return <EmptyState icon="⚠️" title="Error" message={error ?? 'Failed to load data'} />;

  function setFilter(key: string, values: string[]) {
    setFilters(f => ({ ...f, [key]: values }));
  }

  const filteredWeapons = useMemo(() => {
    let list = searchItems(data.weapons, query, ['name', 'description', 'manufacturer']);
    if (filters.type?.length) list = list.filter(w => filters.type.includes(w.type));
    if (filters.class?.length) list = list.filter(w => filters.class.includes(w.class));
    return list;
  }, [data.weapons, query, filters]);

  const filteredArmor = useMemo(() => {
    let list = searchItems(data.armor, query, ['name', 'description', 'manufacturer']);
    if (filters.type?.length) list = list.filter(a => filters.type.includes(a.type));
    if (filters.class?.length) list = list.filter(a => filters.class.includes(a.class));
    return list;
  }, [data.armor, query, filters]);

  function getObtainBadge(method: string) {
    const cls = method === 'buy' ? 'badge-buy' : method === 'loot' ? 'badge-loot' : method === 'craft' ? 'badge-craft' : 'badge-mission';
    return <span key={method} className={`badge ${cls}`}>{formatObtainMethod(method)}</span>;
  }

  function formatType(t: string) {
    return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Combat</h1>
        <SearchBar placeholder={`Search ${tab}...`} value={query} onChange={v => { setQuery(v); }} />
      </div>

      <div className="tabs">
        <button className={`tab-btn${tab === 'weapons' ? ' active' : ''}`} onClick={() => { setTab('weapons'); setFilters({}); }}>
          🔫 Weapons ({data.weapons.length})
        </button>
        <button className={`tab-btn${tab === 'armor' ? ' active' : ''}`} onClick={() => { setTab('armor'); setFilters({}); }}>
          🛡️ Armor ({data.armor.length})
        </button>
      </div>

      <FilterPanel
        groups={tab === 'weapons' ? WEAPON_FILTERS : ARMOR_FILTERS}
        active={filters}
        onChange={setFilter}
        onClear={() => setFilters({})}
      />

      {tab === 'weapons' && (
        <>
          <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
            Showing {filteredWeapons.length} of {data.weapons.length} weapons
          </p>
          {filteredWeapons.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid-cards">
              {filteredWeapons.map(weapon => (
                <ItemCard
                  key={weapon.id}
                  title={weapon.name}
                  description={weapon.description}
                  badges={
                    <>
                      <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)', border: '1px solid var(--accent-red)' }}>
                        {formatType(weapon.type)}
                      </span>
                      <span className="badge" style={{ background: 'rgba(79,157,255,0.15)', color: 'var(--accent-blue)', border: '1px solid var(--accent-blue)' }}>
                        {weapon.class === 'fps' ? 'FPS' : 'Ship'}
                      </span>
                    </>
                  }
                  footer={
                    <div className="flex-wrap-gap">
                      <span className="tag">🏭 {weapon.manufacturer}</span>
                      {weapon.damage && <span className="tag">💥 {weapon.damage}</span>}
                      {weapon.magazineSize && <span className="tag">📦 {weapon.magazineSize} rnd</span>}
                      <div className="flex-wrap-gap">
                        {Array.from(new Set(weapon.obtainMethods.map(m => m.method))).map(m => getObtainBadge(m))}
                      </div>
                    </div>
                  }
                  onClick={() => navigate(`/item/weapon/${weapon.id}`)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'armor' && (
        <>
          <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
            Showing {filteredArmor.length} of {data.armor.length} armor pieces
          </p>
          {filteredArmor.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid-cards">
              {filteredArmor.map(armor => (
                <ItemCard
                  key={armor.id}
                  title={armor.name}
                  description={armor.description}
                  badges={
                    <>
                      <span className="badge" style={{ background: 'rgba(107,114,128,0.2)', color: '#9ca3af', border: '1px solid #4b5563' }}>
                        {formatType(armor.type)}
                      </span>
                      <span className={`badge badge-rarity-${armor.class === 'heavy' ? 'rare' : armor.class === 'medium' ? 'uncommon' : 'common'}`}>
                        {armor.class.charAt(0).toUpperCase() + armor.class.slice(1)}
                      </span>
                    </>
                  }
                  footer={
                    <div className="flex-wrap-gap">
                      <span className="tag">🏭 {armor.manufacturer}</span>
                      {armor.protection && <span className="tag">🛡️ {armor.protection}</span>}
                      <div className="flex-wrap-gap">
                        {Array.from(new Set(armor.obtainMethods.map(m => m.method))).map(m => getObtainBadge(m))}
                      </div>
                    </div>
                  }
                  onClick={() => navigate(`/item/armor/${armor.id}`)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
