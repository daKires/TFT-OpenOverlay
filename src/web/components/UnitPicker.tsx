import { useState } from 'react';
import type { Champion, ChampionId } from '../../core/index';

interface Props {
  champions: Champion[];
  selected: Set<ChampionId>;
  onToggle: (id: ChampionId) => void;
}

const COSTS = [1, 2, 3, 4, 5] as const;

export function UnitPicker({ champions, selected, onToggle }: Props) {
  const [q, setQ] = useState('');
  const [costs, setCosts] = useState<Set<number>>(new Set());
  const term = q.trim().toLowerCase();
  const filtered = champions.filter(
    (c) => c.name.toLowerCase().includes(term) && (costs.size === 0 || costs.has(c.cost)),
  );

  const toggleCost = (cost: number) => {
    setCosts((prev) => {
      const next = new Set(prev);
      if (next.has(cost)) next.delete(cost);
      else next.add(cost);
      return next;
    });
  };

  return (
    <div className="picker">
      <div className="picker__head">
        <h3>
          Unidades <span className="count">{selected.size}</span>
        </h3>
        <input
          className="search"
          placeholder="Buscar campeão…"
          aria-label="Buscar campeão"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="cost-filter" role="group" aria-label="Filtrar por custo">
        {COSTS.map((cost) => (
          <button
            key={cost}
            type="button"
            className={`cost-filter__btn cost-${cost} ${costs.has(cost) ? 'cost-filter__btn--on' : ''}`}
            aria-pressed={costs.has(cost)}
            onClick={() => toggleCost(cost)}
          >
            {cost}
          </button>
        ))}
        <button
          type="button"
          className={`cost-filter__btn cost-filter__btn--all ${costs.size === 0 ? 'cost-filter__btn--on' : ''}`}
          aria-pressed={costs.size === 0}
          onClick={() => setCosts(new Set())}
        >
          Todos
        </button>
      </div>
      <div className="chips">
        {filtered.map((c) => (
          <button
            key={c.id}
            className={`chip cost-${c.cost} ${selected.has(c.id) ? 'chip--on' : ''}`}
            aria-pressed={selected.has(c.id)}
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
