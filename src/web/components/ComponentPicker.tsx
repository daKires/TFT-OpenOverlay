import type { Component, ComponentId } from '../../core/index';

interface Props {
  components: Component[];
  counts: Record<ComponentId, number>;
  onAdd: (id: ComponentId) => void;
  onRemove: (id: ComponentId) => void;
}

export function ComponentPicker({ components, counts, onAdd, onRemove }: Props) {
  const total = Object.values(counts).reduce((s, n) => s + n, 0);

  return (
    <div className="picker">
      <div className="picker__head">
        <h3>
          Peças <span className="count">{total}</span>
        </h3>
        <span className="picker__hint">clique pra adicionar (pode repetir)</span>
      </div>
      <div className="components">
        {components.map((c) => {
          const n = counts[c.id] ?? 0;
          return (
            <div key={c.id} className={`comp-row ${n > 0 ? 'comp-row--on' : ''}`}>
              <button className="comp-row__main" onClick={() => onAdd(c.id)} title="Adicionar">
                {c.name}
              </button>
              <div className="stepper">
                <button onClick={() => onRemove(c.id)} disabled={n === 0} aria-label="Remover">
                  −
                </button>
                <span className="stepper__n">{n}</span>
                <button onClick={() => onAdd(c.id)} aria-label="Adicionar">
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
