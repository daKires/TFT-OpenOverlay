import { useMemo, useState } from 'react';
import {
  suggestComps,
  createDefaultRecipeBook,
  EXAMPLE_COMPS,
  EXAMPLE_CHAMPIONS,
  championName,
  COMPONENT_LIST,
  type ChampionId,
  type ComponentId,
  type HeldState,
} from '../core/index';
import { UnitPicker } from './components/UnitPicker';
import { ComponentPicker } from './components/ComponentPicker';
import { ResultCard } from './components/ResultCard';

// A UI é só um ADAPTADOR: monta um HeldState e chama o cérebro. Nada da lógica
// de scoring vive aqui.
const book = createDefaultRecipeBook();

export function App() {
  const [units, setUnits] = useState<Set<ChampionId>>(new Set());
  const [counts, setCounts] = useState<Record<ComponentId, number>>({});

  const held: HeldState = useMemo(() => {
    const components: ComponentId[] = [];
    for (const [id, n] of Object.entries(counts)) {
      for (let i = 0; i < n; i++) components.push(id);
    }
    return { units: [...units].map((championId) => ({ championId })), components };
  }, [units, counts]);

  const top3 = useMemo(
    () => suggestComps(held, EXAMPLE_COMPS, { book, championName }).slice(0, 3),
    [held],
  );

  function toggleUnit(id: ChampionId) {
    setUnits((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  const addComponent = (id: ComponentId) => setCounts((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
  const removeComponent = (id: ComponentId) =>
    setCounts((p) => ({ ...p, [id]: Math.max(0, (p[id] ?? 0) - 1) }));
  const clearAll = () => {
    setUnits(new Set());
    setCounts({});
  };

  const hasInput = units.size > 0 || Object.values(counts).some((n) => n > 0);

  return (
    <div className="app">
      <header className="app__header">
        <h1>
          TFT <span className="dot">·</span> Sugeridor de Comps
        </h1>
        <p>Diga o que você tem — as unidades e as peças de item soltas — e veja as 3 comps que mais combinam.</p>
      </header>

      <div className="layout">
        <section className="panel">
          <UnitPicker champions={EXAMPLE_CHAMPIONS} selected={units} onToggle={toggleUnit} />
          <ComponentPicker components={COMPONENT_LIST} counts={counts} onAdd={addComponent} onRemove={removeComponent} />
          {hasInput && (
            <button className="btn-clear" onClick={clearAll}>
              Limpar tudo
            </button>
          )}
        </section>

        <section className="results">
          <h2>Top 3 comps pra você</h2>
          {!hasInput && (
            <p className="hint">Escolha ao menos uma unidade ou uma peça pra ver as sugestões.</p>
          )}
          {hasInput && top3.map((s, i) => <ResultCard key={s.comp.id} suggestion={s} rank={i + 1} />)}
        </section>
      </div>

      <footer className="app__footer">
        Dados de exemplo (fictícios). A lógica é desacoplada: hoje esta tela monta o estado; amanhã ele pode vir de
        visão computacional, Overwolf ou da API da Riot — sem mudar o cérebro.
      </footer>
    </div>
  );
}
