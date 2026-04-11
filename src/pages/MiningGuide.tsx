import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import LoadingSpinner from '../components/LoadingSpinner';
import TypeBadge from '../components/TypeBadge';
import RarityBadge from '../components/RarityBadge';
import { getByIds } from '../utils/dataUtils';

const TABS = [
  { id: 'fps-mining', label: '🧤 FPS Mining' },
  { id: 'roc-mining', label: '🚛 ROC Mining' },
  { id: 'ship-mining', label: '🚀 Ship Mining' },
];

const STEPS: Record<string, string[]> = {
  'fps-mining': [
    'Equip a Multi-Tool with a mining attachment (OreBit or OreMax head).',
    'Land on a planetary body or enter a cave system.',
    'Aim at a glowing mineral node — use the mining beam to charge it.',
    'Maintain the charge in the green zone to fracture the rock safely.',
    'Collect the ejected mineral fragments by walking over them.',
    'Return to your ship and sell ore at a commodity terminal.',
  ],
  'roc-mining': [
    'Acquire an Argo ROC ground mining vehicle from a ship dealer.',
    'Load the ROC into a ship with sufficient cargo space (e.g., Cutlass, Nomad).',
    'Land on a moon or planet with surface mineral deposits.',
    'Deploy the ROC and drive to scan for minable rocks.',
    'Position the ROC arms over the deposit and fire the mining lasers.',
    'Collect the ore with the ROC\'s tractor beam into its hopper.',
    'Return mined ore to a refinery or commodity terminal.',
  ],
  'ship-mining': [
    'Obtain a dedicated mining ship: Drake Prospector (solo) or Argo MOLE (crew).',
    'Equip your ship with mining laser upgrades and gadgets for efficiency.',
    'Travel to an asteroid belt — Yela Belt or Aaron Halo for best yields.',
    'Use the ship\'s scanner to identify valuable ore-rich rocks.',
    'Charge the mining laser in the optimal zone — too fast causes explosion.',
    'Use fracturing charges (Surge, FLTR-L, etc.) to assist difficult rocks.',
    'Collect ore fragments into your cargo hold using the tractor beam.',
    'Refine ore at an orbital refinery platform or sell raw at commodity terminals.',
    'Be alert for pirates — Quantanium miners are prime targets!',
  ],
};

export default function MiningGuide() {
  const { data, loading, error } = useData();
  const [tab, setTab] = useState('fps-mining');
  const navigate = useNavigate();

  if (loading) return <LoadingSpinner />;
  if (error || !data) return <div className="text-secondary" style={{ padding: '2rem' }}>Failed to load data.</div>;

  const method = data.miningMethods.find(m => m.id === tab);
  const resources = method ? getByIds(data.resources, method.resourceIds) : [];
  const tools = method ? getByIds(data.tools, method.toolIds) : [];
  const vehicles = method ? getByIds(data.vehicles, method.vehicleIds) : [];

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Mining Guide</h1>
      </div>
      <p className="text-secondary" style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>
        Star Citizen has three main mining methods — each suited for different scales of operation and resource types.
        Choose a method below to see what you need and where to go.
      </p>

      <div className="tabs">
        {TABS.map(t => (
          <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {method && (
        <div className="mining-method-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>{method.name}</h2>
            <TypeBadge type={method.type} label={method.type.toUpperCase()} />
          </div>
          <p className="text-secondary" style={{ lineHeight: 1.7, marginBottom: '1.5rem' }}>{method.description}</p>

          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            📋 Step-by-Step Guide
          </h3>
          <ol className="mining-steps" style={{ marginBottom: '1.5rem' }}>
            {(STEPS[tab] ?? []).map((step, i) => (
              <li key={i} className="mining-step">
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{step}</span>
              </li>
            ))}
          </ol>

          <hr className="divider" />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {tools.length > 0 && (
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                  🔧 Required Tools
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {tools.map(tool => (
                    <div
                      key={tool.id}
                      className="related-item"
                      onClick={() => navigate(`/item/tool/${tool.id}`)}
                    >
                      <span style={{ fontSize: '1rem' }}>🔧</span>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{tool.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tool.type.replace(/_/g, ' ')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {vehicles.length > 0 && (
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                  🚀 Required Vehicles
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {vehicles.map(v => (
                    <div
                      key={v.id}
                      className="related-item"
                      onClick={() => navigate(`/item/vehicle/${v.id}`)}
                    >
                      <span style={{ fontSize: '1rem' }}>🚀</span>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{v.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.manufacturer}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                💎 Mineable Resources
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {resources.map(r => (
                  <div
                    key={r.id}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.6rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 6, cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onClick={() => navigate(`/item/resource/${r.id}`)}
                  >
                    <TypeBadge type={r.type} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{r.name}</span>
                    <RarityBadge rarity={r.rarity} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '1.25rem', marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>💡 General Mining Tips</h3>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            'Always carry Med Pens — mining areas can be dangerous.',
            'Quantanium decays after mining — sell or process it within ~15 minutes.',
            'Use a scanning gadget on your Multi-Tool to find hidden deposits.',
            'Bring a refinery coolant or power limiter to prevent overcharge explosions.',
            'Watch local chat for pirate alerts near popular asteroid belts.',
          ].map((tip, i) => (
            <li key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--accent-cyan)', flexShrink: 0 }}>•</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
