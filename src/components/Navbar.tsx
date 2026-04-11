import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

const ITEM_CATEGORIES = [
  { key: 'resources', label: 'Resources', fields: ['name', 'description'] as const },
  { key: 'weapons', label: 'Weapons', fields: ['name', 'description'] as const },
  { key: 'armor', label: 'Armor', fields: ['name', 'description'] as const },
  { key: 'locations', label: 'Locations', fields: ['name', 'description'] as const },
  { key: 'tools', label: 'Tools', fields: ['name', 'description'] as const },
  { key: 'vehicles', label: 'Vehicles', fields: ['name', 'description'] as const },
];

function getItemRoute(type: string, id: string): string {
  return `/item/${type.replace(/s$/, '')}/${id}`;
}

export default function Navbar() {
  const { data } = useData();
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const results: { id: string; name: string; type: string; category: string }[] = [];
  if (data && query.trim().length > 1) {
    const q = query.toLowerCase();
    for (const cat of ITEM_CATEGORIES) {
      const items = (data as unknown as Record<string, { id: string; name: string; description?: string }[]>)[cat.key] ?? [];
      for (const item of items) {
        if (item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)) {
          results.push({ id: item.id, name: item.name, type: cat.key.replace(/s$/, ''), category: cat.label });
          if (results.length >= 8) break;
        }
      }
      if (results.length >= 8) break;
    }
  }

  function handleSelect(type: string, id: string) {
    setQuery('');
    setShowResults(false);
    navigate(getItemRoute(type, id));
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="navbar-logo">⭐</span>
          <span className="navbar-title">STAR OPS</span>
        </Link>

        <div className="navbar-search" ref={ref}>
          <div className="navbar-search-wrapper">
            <div className="search-bar">
              <span className="search-bar-icon">🔍</span>
              <input
                className="input"
                placeholder="Search items..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
                onFocus={() => setShowResults(true)}
                style={{ paddingLeft: '2.4rem' }}
              />
              {query && (
                <button className="search-bar-clear" onClick={() => { setQuery(''); setShowResults(false); }}>✕</button>
              )}
            </div>
            {showResults && results.length > 0 && (
              <div className="navbar-search-results">
                {results.map((r) => (
                  <div key={`${r.type}-${r.id}`} className="search-result-item" onClick={() => handleSelect(r.type, r.id)}>
                    <div className="search-result-info">
                      <div className="search-result-name">{r.name}</div>
                      <div className="search-result-type">{r.category}</div>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>→</span>
                  </div>
                ))}
              </div>
            )}
            {showResults && query.trim().length > 1 && results.length === 0 && (
              <div className="navbar-search-results">
                <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>
                  No results for "{query}"
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="navbar-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Home</NavLink>
          <NavLink to="/resources" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Resources</NavLink>
          <NavLink to="/mining" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Mining</NavLink>
          <NavLink to="/crafting" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Crafting</NavLink>
          <NavLink to="/weapons-armor" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Combat</NavLink>
        </div>
      </div>
    </nav>
  );
}
