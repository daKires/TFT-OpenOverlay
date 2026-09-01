import { useState } from 'react';
import type { Champion, ChampionId } from '../../core/index';

interface Props {
  champions: Champion[];
  selected: Set<ChampionId>;
  onToggle: (id: ChampionId) => void;
}

export function UnitPicker({ champions, selected, onToggle }: Props) {
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const filtered = champions.filter((c) => c.name.toLowerCase().includes(term));

  return (
    <div className="picker">
      <div className="picker__head">
        <h3>
          Unidades <span className="count">{selected.size}</span>
        </h3>
        <input
          className="search"
          placeholder="Buscar campeão…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="chips">
        {filtered.map((c) => (
          <button
            key={c.id}
            className={`chip cost-${c.cost} ${selected.has(c.id) ? 'chip--on' : ''}`}
            onClick={() => onToggle(c.id)}
            title={`Custo ${c.cost} · ${(c.traits ?? []).join(', ')}`}
          >
            <span className="chip__cost">{c.cost}</span>
            {c.name}
          </button>
        ))}
        {filtered.length === 0 && <span className="hint">Nenhum campeão encontrado.</span>}
      </div>
    </div>
  );
}
