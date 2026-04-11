import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import SearchBar from '../components/SearchBar';
import LoadingSpinner from '../components/LoadingSpinner';
import ItemCard from '../components/ItemCard';
import RarityBadge from '../components/RarityBadge';
import TypeBadge from '../components/TypeBadge';
import { searchItems } from '../utils/dataUtils';

const QUICK_LINKS = [
  { to: '/resources', icon: '⛏️', title: 'Resources', desc: 'Find minerals, metals, gases and ores' },
  { to: '/mining', icon: '🚀', title: 'Mining Guide', desc: 'FPS, ROC & ship mining methods' },
  { to: '/crafting', icon: '🔧', title: 'Crafting', desc: 'Recipes, blueprints and stations' },
  { to: '/weapons-armor', icon: '🔫', title: 'Combat', desc: 'Weapons, armor and loadouts' },
];

export default function Home() {
  const { data, loading, error } = useData();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  if (loading) return <LoadingSpinner message="Loading Star Citizen data..." />;
  if (error || !data) return (
    <div className="flex-center" style={{ padding: '4rem', flexDirection: 'column', gap: '1rem' }}>
      <span style={{ fontSize: '2rem' }}>⚠️</span>
      <p className="text-secondary">{error ?? 'Failed to load data'}</p>
    </div>
  );

  const searchResults = query.trim().length > 1 ? [
    ...searchItems(data.resources, query, ['name', 'description']).slice(0, 3).map(r => ({ ...r, _type: 'resource' })),
    ...searchItems(data.weapons, query, ['name', 'description']).slice(0, 3).map(r => ({ ...r, _type: 'weapon' })),
    ...searchItems(data.armor, query, ['name', 'description']).slice(0, 3).map(r => ({ ...r, _type: 'armor' })),
    ...searchItems(data.locations, query, ['name', 'description']).slice(0, 2).map(r => ({ ...r, _type: 'location' })),
  ] : [];

  const featuredResources = data.resources.filter(r => r.rarity === 'very_rare' || r.rarity === 'rare').slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <div className="hero-logo">⭐</div>
        <h1 className="hero-title">Star Ops Item Finder</h1>
        <p className="hero-subtitle">
          Your comprehensive database for Star Citizen resources, weapons, armor, crafting, and mining guides.
        </p>
        <div className="hero-search">
          <SearchBar
            placeholder="Search resources, weapons, armor, locations..."
            value={query}
            onChange={setQuery}
          />
        </div>
        {searchResults.length > 0 && (
          <div style={{ maxWidth: 560, margin: '1rem auto 0', background: 'var(--bg-secondary)', border: '1px solid var(--border-hover)', borderRadius: 8, overflow: 'hidden' }}>
            {searchResults.map(item => (
              <div
                key={`${item._type}-${item.id}`}
                className="search-result-item"
                onClick={() => { setQuery(''); navigate(`/item/${item._type}/${item.id}`); }}
                style={{ cursor: 'pointer' }}
              >
                <div className="search-result-info">
                  <div className="search-result-name">{item.name}</div>
                  <div className="search-result-type" style={{ textTransform: 'capitalize' }}>{item._type}</div>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>→</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Stats */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-count">{data.resources.length}</div>
          <div className="stat-card-label">Resources</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-count">{data.weapons.length}</div>
          <div className="stat-card-label">Weapons</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-count">{data.armor.length}</div>
          <div className="stat-card-label">Armor Pieces</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-count">{data.recipes.length}</div>
          <div className="stat-card-label">Recipes</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-count">{data.locations.length}</div>
          <div className="stat-card-label">Locations</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-count">{data.vendors.length}</div>
          <div className="stat-card-label">Vendors</div>
        </div>
      </section>

      {/* Quick Links */}
      <section>
        <div className="section-header">
          <h2 className="section-title">Explore</h2>
        </div>
        <div className="quick-links">
          {QUICK_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="quick-link-card">
              <span className="quick-link-icon">{link.icon}</span>
              <span className="quick-link-title">{link.title}</span>
              <span className="quick-link-desc">{link.desc}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Resources */}
      <section>
        <div className="section-header">
          <h2 className="section-title">High-Value Resources</h2>
          <Link to="/resources" className="btn btn-secondary btn-sm">View All →</Link>
        </div>
        <div className="grid-cards">
          {featuredResources.map((res) => (
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
                  {res.locationIds.slice(0, 2).map(lid => (
                    <span key={lid} className="tag">{lid.replace(/-/g, ' ')}</span>
                  ))}
                  {res.locationIds.length > 2 && <span className="tag">+{res.locationIds.length - 2}</span>}
                </div>
              }
              onClick={() => navigate(`/item/resource/${res.id}`)}
            />
          ))}
        </div>
      </section>

      {/* Patch note */}
      <div style={{ marginTop: '2rem', padding: '0.75rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        📋 Data patch: <strong style={{ color: 'var(--accent-cyan)' }}>{data.meta.patch}</strong> — {data.meta.note}
      </div>
    </div>
  );
}
