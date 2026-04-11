import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import RarityBadge from '../components/RarityBadge';
import RiskBadge from '../components/RiskBadge';
import TypeBadge from '../components/TypeBadge';
import { getById, getByIds, formatObtainMethod } from '../utils/dataUtils';

function formatType(t: string) {
  return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function ItemDetail() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const { data, loading, error } = useData();
  const navigate = useNavigate();

  if (loading) return <LoadingSpinner />;
  if (error || !data) return <EmptyState icon="⚠️" title="Error" message={error ?? 'Failed to load data'} />;
  if (!type || !id) return <EmptyState title="Invalid URL" />;

  function renderResource() {
    const item = getById(data!.resources, id!);
    if (!item) return <EmptyState title="Resource not found" />;
    const locations = getByIds(data!.locations, item.locationIds);
    const methods = getByIds(data!.miningMethods, item.miningMethodIds);
    const tools = getByIds(data!.tools, item.toolIds);
    const vehicles = getByIds(data!.vehicles, item.vehicleIds);
    const recipes = getByIds(data!.recipes, item.recipeIds);

    return (
      <>
        <div className="detail-header">
          <h1 className="detail-title">{item.name}</h1>
          <div className="detail-badges">
            <TypeBadge type={item.type} />
            <RarityBadge rarity={item.rarity} />
            {item.patch && <span className="badge" style={{ background: 'rgba(100,116,139,0.2)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>Patch {item.patch}</span>}
          </div>
          <p className="detail-desc">{item.description}</p>
        </div>

        {locations.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">📍 Found At</div>
            <div className="related-items-grid">
              {locations.map(loc => (
                <div key={loc.id} className="related-item" onClick={() => navigate(`/item/location/${loc.id}`)}>
                  <span>📍</span>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{loc.name}</div>
                    <RiskBadge level={loc.riskLevel} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {methods.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">⛏️ Mining Methods</div>
            <div className="related-items-grid">
              {methods.map(m => (
                <div key={m.id} className="related-item" onClick={() => navigate(`/mining`)}>
                  <span>⛏️</span>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{m.name}</div>
                    <TypeBadge type={m.type} label={m.type.toUpperCase()} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tools.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">🔧 Mining Tools</div>
            <div className="related-items-grid">
              {tools.map(t => (
                <div key={t.id} className="related-item" onClick={() => navigate(`/item/tool/${t.id}`)}>
                  <span>🔧</span>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{t.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatType(t.type)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {vehicles.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">🚀 Mining Vehicles</div>
            <div className="related-items-grid">
              {vehicles.map(v => (
                <div key={v.id} className="related-item" onClick={() => navigate(`/item/vehicle/${v.id}`)}>
                  <span>🚀</span>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{v.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.manufacturer}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {recipes.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">🔬 Used In Recipes</div>
            {recipes.map(r => (
              <div key={r.id} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 8, marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>{r.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Station: {r.craftingStation}</div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  function renderWeapon() {
    const item = getById(data!.weapons, id!);
    if (!item) return <EmptyState title="Weapon not found" />;
    return (
      <>
        <div className="detail-header">
          <h1 className="detail-title">{item.name}</h1>
          <div className="detail-badges">
            <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)', border: '1px solid var(--accent-red)' }}>{formatType(item.type)}</span>
            <span className="badge" style={{ background: 'rgba(79,157,255,0.15)', color: 'var(--accent-blue)', border: '1px solid var(--accent-blue)' }}>{item.class === 'fps' ? 'FPS' : 'Ship Weapon'}</span>
            {item.patch && <span className="badge" style={{ background: 'rgba(100,116,139,0.2)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>Patch {item.patch}</span>}
          </div>
          <p className="detail-desc">{item.description}</p>
        </div>

        <div className="detail-section">
          <div className="detail-section-title">📊 Specifications</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'Manufacturer', value: item.manufacturer },
              item.damage && { label: 'Damage', value: item.damage },
              item.range && { label: 'Range', value: item.range },
              item.fireRate && { label: 'Fire Rate', value: item.fireRate },
              item.magazineSize && { label: 'Magazine', value: `${item.magazineSize} rounds` },
            ].filter(Boolean).map((s) => {
              const spec = s as { label: string; value: string | number };
              return (
                <div key={spec.label} className="stat-item">
                  <div className="stat-label">{spec.label}</div>
                  <div className="stat-value">{spec.value}</div>
                </div>
              );
            })}
          </div>
        </div>

        {item.obtainMethods.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">🛒 How to Obtain</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {item.obtainMethods.map((om, i) => {
                const vendor = om.vendorId ? getById(data!.vendors, om.vendorId) : undefined;
                const location = om.locationId ? getById(data!.locations, om.locationId) : undefined;
                const loot = om.lootSourceId ? getById(data!.lootSources, om.lootSourceId) : undefined;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                    <span className={`badge badge-${om.method === 'buy' ? 'buy' : om.method === 'loot' ? 'loot' : om.method === 'craft' ? 'craft' : 'mission'}`}>
                      {formatObtainMethod(om.method)}
                    </span>
                    <div style={{ flex: 1, fontSize: '0.875rem' }}>
                      {vendor && <span style={{ color: 'var(--text-primary)' }}>🏪 {vendor.name}</span>}
                      {loot && <span style={{ color: 'var(--text-primary)' }}>📦 {loot.name}</span>}
                      {location && <span style={{ color: 'var(--text-secondary)' }}> @ {location.name}</span>}
                      {om.notes && <span style={{ color: 'var(--text-muted)' }}> — {om.notes}</span>}
                    </div>
                    {om.price && (
                      <span style={{ color: 'var(--accent-green)', fontWeight: 600, fontSize: '0.875rem' }}>
                        {om.price.toLocaleString()} {om.currency}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </>
    );
  }

  function renderArmor() {
    const item = getById(data!.armor, id!);
    if (!item) return <EmptyState title="Armor not found" />;
    return (
      <>
        <div className="detail-header">
          <h1 className="detail-title">{item.name}</h1>
          <div className="detail-badges">
            <span className="badge" style={{ background: 'rgba(107,114,128,0.2)', color: '#9ca3af', border: '1px solid #4b5563' }}>{formatType(item.type)}</span>
            <span className={`badge badge-rarity-${item.class === 'heavy' ? 'rare' : item.class === 'medium' ? 'uncommon' : 'common'}`}>{formatType(item.class)}</span>
            {item.patch && <span className="badge" style={{ background: 'rgba(100,116,139,0.2)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>Patch {item.patch}</span>}
          </div>
          <p className="detail-desc">{item.description}</p>
        </div>

        <div className="detail-section">
          <div className="detail-section-title">📊 Specifications</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'Manufacturer', value: item.manufacturer },
              item.protection && { label: 'Protection', value: item.protection },
              ...Object.entries(item.stats ?? {}).map(([k, v]) => ({ label: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), value: String(v) })),
            ].filter(Boolean).map((s) => {
              const spec = s as { label: string; value: string };
              return (
                <div key={spec.label} className="stat-item">
                  <div className="stat-label">{spec.label}</div>
                  <div className="stat-value">{spec.value}</div>
                </div>
              );
            })}
          </div>
        </div>

        {item.obtainMethods.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">🛒 How to Obtain</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {item.obtainMethods.map((om, i) => {
                const vendor = om.vendorId ? getById(data!.vendors, om.vendorId) : undefined;
                const loot = om.lootSourceId ? getById(data!.lootSources, om.lootSourceId) : undefined;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                    <span className={`badge badge-${om.method === 'buy' ? 'buy' : om.method === 'loot' ? 'loot' : om.method === 'craft' ? 'craft' : 'mission'}`}>
                      {formatObtainMethod(om.method)}
                    </span>
                    <div style={{ flex: 1, fontSize: '0.875rem' }}>
                      {vendor && <span style={{ color: 'var(--text-primary)' }}>🏪 {vendor.name}</span>}
                      {loot && <span style={{ color: 'var(--text-primary)' }}>📦 {loot.name}</span>}
                      {om.notes && <span style={{ color: 'var(--text-muted)' }}>{om.notes}</span>}
                    </div>
                    {om.price && (
                      <span style={{ color: 'var(--accent-green)', fontWeight: 600, fontSize: '0.875rem' }}>
                        {om.price.toLocaleString()} {om.currency}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </>
    );
  }

  function renderLocation() {
    const item = getById(data!.locations, id!);
    if (!item) return <EmptyState title="Location not found" />;
    const resources = getByIds(data!.resources, item.resourceIds);
    const vendors = getByIds(data!.vendors, item.vendorIds);
    const lootSources = getByIds(data!.lootSources, item.lootSourceIds);

    return (
      <>
        <div className="detail-header">
          <h1 className="detail-title">{item.name}</h1>
          <div className="detail-badges">
            <TypeBadge type={item.type} />
            <RiskBadge level={item.riskLevel} />
            <span className="badge" style={{ background: 'rgba(100,116,139,0.2)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
              {item.system} System
            </span>
          </div>
          <p className="detail-desc">{item.description}</p>
        </div>

        {resources.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">💎 Available Resources</div>
            <div className="related-items-grid">
              {resources.map(r => (
                <div key={r.id} className="related-item" onClick={() => navigate(`/item/resource/${r.id}`)}>
                  <TypeBadge type={r.type} />
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{r.name}</div>
                    <RarityBadge rarity={r.rarity} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {vendors.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">🏪 Vendors</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {vendors.map(v => (
                <div key={v.id} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>{v.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{v.description}</div>
                  <div className="flex-wrap-gap" style={{ marginTop: '0.4rem' }}>
                    {v.inventoryTypes.map(t => <span key={t} className="tag">{t}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {lootSources.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">📦 Loot Sources</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {lootSources.map(ls => (
                <div key={ls.id} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{ls.name}</span>
                    <RiskBadge level={ls.riskLevel} />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{ls.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  }

  function renderTool() {
    const item = getById(data!.tools, id!);
    if (!item) return <EmptyState title="Tool not found" />;
    const vendors = getByIds(data!.vendors, item.vendorIds);
    return (
      <>
        <div className="detail-header">
          <h1 className="detail-title">{item.name}</h1>
          <div className="detail-badges">
            <TypeBadge type={item.type} />
            <span className={`badge badge-${item.obtainMethod}`}>{formatObtainMethod(item.obtainMethod)}</span>
          </div>
          <p className="detail-desc">{item.description}</p>
        </div>
        {item.price && (
          <div className="detail-section">
            <div className="detail-section-title">💰 Price</div>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-green)' }}>
              {item.price.toLocaleString()} {item.currency}
            </span>
          </div>
        )}
        {vendors.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">🏪 Available At</div>
            <div className="related-items-grid">
              {vendors.map(v => (
                <div key={v.id} className="related-item" onClick={() => navigate(`/item/location/${v.locationId}`)}>
                  <span>🏪</span>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{v.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatType(v.type)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  }

  function renderVehicle() {
    const item = getById(data!.vehicles, id!);
    if (!item) return <EmptyState title="Vehicle not found" />;
    return (
      <>
        <div className="detail-header">
          <h1 className="detail-title">{item.name}</h1>
          <div className="detail-badges">
            <TypeBadge type={item.type} />
            <span className={`badge badge-${item.obtainMethod}`}>{formatObtainMethod(item.obtainMethod)}</span>
          </div>
          <p className="detail-desc">{item.description}</p>
        </div>
        <div className="detail-section">
          <div className="detail-section-title">📊 Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
            <div className="stat-item"><div className="stat-label">Manufacturer</div><div className="stat-value">{item.manufacturer}</div></div>
            {item.price && <div className="stat-item"><div className="stat-label">Price</div><div className="stat-value" style={{ color: 'var(--accent-green)' }}>{item.price.toLocaleString()} {item.currency}</div></div>}
          </div>
        </div>
      </>
    );
  }

  const ROUTE_MAP: Record<string, string> = {
    resource: '/resources',
    weapon: '/weapons-armor',
    armor: '/weapons-armor',
    location: '/',
    tool: '/mining',
    vehicle: '/mining',
  };

  const LABEL_MAP: Record<string, string> = {
    resource: 'Resources',
    weapon: 'Combat',
    armor: 'Combat',
    location: 'Home',
    tool: 'Mining Guide',
    vehicle: 'Mining Guide',
  };

  return (
    <div className="detail-page">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <span className="breadcrumb-sep">›</span>
        <Link to={ROUTE_MAP[type] ?? '/'}>{LABEL_MAP[type] ?? type}</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{id?.replace(/-/g, ' ')}</span>
      </div>

      {type === 'resource' && renderResource()}
      {type === 'weapon' && renderWeapon()}
      {type === 'armor' && renderArmor()}
      {type === 'location' && renderLocation()}
      {type === 'tool' && renderTool()}
      {type === 'vehicle' && renderVehicle()}
      {!['resource', 'weapon', 'armor', 'location', 'tool', 'vehicle'].includes(type) && (
        <EmptyState title={`Unknown item type: ${type}`} />
      )}
    </div>
  );
}
