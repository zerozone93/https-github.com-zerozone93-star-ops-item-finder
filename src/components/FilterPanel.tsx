interface FilterOption {
  value: string;
  label: string;
}

interface FilterGroupDef {
  key: string;
  label: string;
  options: FilterOption[];
  type?: 'checkbox' | 'select';
}

interface Props {
  groups: FilterGroupDef[];
  active: Record<string, string[]>;
  onChange: (key: string, values: string[]) => void;
  onClear: () => void;
}

export default function FilterPanel({ groups, active, onChange, onClear }: Props) {
  function toggleCheckbox(key: string, value: string) {
    const current = active[key] ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange(key, next);
  }

  const hasActive = Object.values(active).some((v) => v.length > 0);

  return (
    <div className="filter-panel">
      <div className="filter-panel-title">🔧 Filters</div>
      <div className="filter-groups">
        {groups.map((group) => (
          <div key={group.key} className="filter-group">
            <div className="filter-group-label">{group.label}</div>
            <div className="filter-checkboxes">
              {group.options.map((opt) => (
                <label key={opt.value} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={(active[group.key] ?? []).includes(opt.value)}
                    onChange={() => toggleCheckbox(group.key, opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      {hasActive && (
        <div className="filter-actions">
          <button className="btn btn-ghost btn-sm" onClick={onClear}>Clear Filters</button>
        </div>
      )}
    </div>
  );
}
