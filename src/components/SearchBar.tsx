import { useState, useEffect, useRef } from 'react';

interface Props {
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  debounce?: number;
}

export default function SearchBar({ placeholder = 'Search...', value = '', onChange, debounce = 300 }: Props) {
  const [internal, setInternal] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setInternal(value); }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setInternal(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(v), debounce);
  }

  function handleClear() {
    setInternal('');
    onChange('');
  }

  return (
    <div className="search-bar">
      <span className="search-bar-icon">🔍</span>
      <input
        className="input"
        placeholder={placeholder}
        value={internal}
        onChange={handleChange}
        style={{ paddingLeft: '2.4rem' }}
      />
      {internal && (
        <button className="search-bar-clear" onClick={handleClear}>✕</button>
      )}
    </div>
  );
}
