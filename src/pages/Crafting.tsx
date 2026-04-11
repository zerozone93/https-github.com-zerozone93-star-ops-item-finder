import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import SearchBar from '../components/SearchBar';
import { searchItems, getById } from '../utils/dataUtils';

export default function Crafting() {
  const { data, loading, error } = useData();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  if (loading) return <LoadingSpinner />;
  if (error || !data) return <EmptyState icon="⚠️" title="Error" message={error ?? 'Failed to load data'} />;

  const filteredRecipes = useMemo(() => {
    let list = searchItems(data.recipes, query, ['name', 'description']);
    if (typeFilter) list = list.filter(r => r.outputItemType === typeFilter);
    return list;
  }, [data.recipes, query, typeFilter]);

  const OUTPUT_TYPES = Array.from(new Set(data.recipes.map(r => r.outputItemType)));

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Crafting</h1>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <SearchBar placeholder="Search recipes..." value={query} onChange={setQuery} />
          <select
            className="input"
            style={{ width: 'auto', minWidth: 160 }}
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="">All Output Types</option>
            {OUTPUT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
        Crafting allows you to convert raw resources into valuable components, armor, and consumables.
        Blueprints are required for most advanced recipes. Find them at vendors or as rare loot.
      </p>

      {/* Recipes */}
      <section>
        <div className="section-header">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            🔧 Recipes ({filteredRecipes.length})
          </h2>
        </div>

        {filteredRecipes.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredRecipes.map(recipe => {
              const blueprint = recipe.blueprintId ? getById(data.blueprints, recipe.blueprintId) : undefined;
              return (
                <div key={recipe.id} className="recipe-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{recipe.name}</h3>
                    <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                      <span className="badge" style={{ background: 'rgba(79,157,255,0.15)', color: 'var(--accent-blue)', border: '1px solid var(--accent-blue)' }}>
                        {recipe.outputItemType}
                      </span>
                      {recipe.outputQuantity > 1 && (
                        <span className="badge" style={{ background: 'rgba(0,212,255,0.1)', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)' }}>
                          ×{recipe.outputQuantity}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '1rem', lineHeight: 1.5 }}>{recipe.description}</p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                        Ingredients
                      </div>
                      <div className="ingredient-list">
                        {recipe.ingredients.map((ing, i) => (
                          <div key={i} className="ingredient-item">
                            <span className="ingredient-name">{ing.name}</span>
                            <span className="ingredient-qty">×{ing.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                        Details
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <span className="text-muted">🏭 Station:</span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{recipe.craftingStation}</span>
                        </div>
                        {recipe.craftingTime && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <span className="text-muted">⏱️ Time:</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{recipe.craftingTime}</span>
                          </div>
                        )}
                        {blueprint ? (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <span className="text-muted">📋 Blueprint:</span>
                            <span style={{ color: 'var(--accent-cyan)', fontWeight: 500 }}>{blueprint.name}</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <span className="text-muted">📋 Blueprint:</span>
                            <span style={{ color: 'var(--accent-green)' }}>Not required</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <hr className="divider" style={{ marginTop: '2.5rem' }} />

      {/* Blueprints */}
      <section>
        <div className="section-header" style={{ marginTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            📋 Blueprints ({data.blueprints.length})
          </h2>
        </div>
        <div className="grid-cards">
          {data.blueprints.map(bp => {
            const recipe = getById(data.recipes, bp.recipeId);
            return (
              <div key={bp.id} className="card">
                <div className="card-title" style={{ marginBottom: '0.4rem' }}>{bp.name}</div>
                {recipe && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>
                    Unlocks: {recipe.name}
                  </div>
                )}
                <p className="card-description" style={{ marginBottom: '0.75rem' }}>{bp.description}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  <span className={`badge badge-${bp.obtainMethod === 'buy' ? 'buy' : bp.obtainMethod === 'loot' ? 'loot' : 'mission'}`}>
                    {bp.obtainMethod.replace(/_/g, ' ')}
                  </span>
                  {bp.price && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)', fontWeight: 600 }}>
                      {bp.price.toLocaleString()} aUEC
                    </span>
                  )}
                  {!bp.price && bp.obtainMethod === 'loot' && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-yellow)' }}>Rare drop</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
