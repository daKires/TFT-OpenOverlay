import { useMemo } from 'react';
import {
  suggestComps,
  loadData,
  COMPONENT_LIST,
  type ChampionId,
  type ComponentId,
  type HeldState,
} from '../core/index';
import { UnitPicker } from './components/UnitPicker';
import { ComponentPicker } from './components/ComponentPicker';
import { ResultCard } from './components/ResultCard';
import { AnalysisPanel } from './components/AnalysisPanel';
import { BoardContext, type Economy } from './components/BoardContext';
import { JevSettings } from './components/JevSettings';
import { usePersistentState } from './usePersistentState';

// A UI é só um ADAPTADOR: monta um HeldState e chama o cérebro. Os dados vêm do
// loadData() — reais do set quando o importador rodou, senão os de exemplo.
const data = loadData();

export function App() {
  // Sets viram arrays na persistência (serializa/desserializa).
  const [unitIds, setUnitIds] = usePersistentState<ChampionId[]>('tft.units', []);
  const [counts, setCounts] = usePersistentState<Record<ComponentId, number>>('tft.counts', {});
  const [economy, setEconomy] = usePersistentState<Economy>('tft.economy', {});

  const units = useMemo(() => new Set(unitIds), [unitIds]);

  const held: HeldState = useMemo(() => {
    const components: ComponentId[] = [];
    for (const [id, n] of Object.entries(counts)) {
      for (let i = 0; i < n; i++) components.push(id);
    }
    return { units: [...units].map((championId) => ({ championId })), components };
  }, [units, counts]);

  // suggestComps já devolve ordenado — os 5 primeiros alimentam a análise híbrida.
  const candidates = useMemo(
    () => suggestComps(held, data.comps, { book: data.book, championName: data.championName }).slice(0, 5),
    [held],
  );
  const top3 = candidates.slice(0, 3);

  function toggleUnit(id: ChampionId) {
    setUnitIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  const addComponent = (id: ComponentId) => setCounts((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
  const removeComponent = (id: ComponentId) =>
    setCounts((p) => ({ ...p, [id]: Math.max(0, (p[id] ?? 0) - 1) }));
  const clearAll = () => {
    setUnitIds([]);
    setCounts({});
    setEconomy({});
  };

  const hasInput = units.size > 0 || Object.values(counts).some((n) => n > 0);

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__header-text">
          <h1>
            TFT <span className="dot">·</span> Sugeridor de Comps
          </h1>
          <p>Diga o que você tem — as unidades e as peças de item soltas — e veja as 3 comps que mais combinam.</p>
        </div>
        <JevSettings />
      </header>

      <div className="layout">
        <section className="panel">
          <BoardContext economy={economy} onChange={setEconomy} />
          <UnitPicker champions={data.champions} selected={units} onToggle={toggleUnit} />
          <ComponentPicker components={COMPONENT_LIST} counts={counts} onAdd={addComponent} onRemove={removeComponent} />
          {hasInput && (
            <button className="btn-clear" onClick={clearAll}>
              Limpar tudo
            </button>
          )}
        </section>

        <section className="results">
          {hasInput && (
            <AnalysisPanel
              candidates={candidates}
              held={held}
              economy={economy}
              champions={data.champions}
              championName={data.championName}
            />
          )}
          <h2>Top 3 comps pra você</h2>
          {!hasInput && (
            <p className="hint">Escolha ao menos uma unidade ou uma peça pra ver as sugestões.</p>
          )}
          {hasInput && top3.map((s, i) => (
            <ResultCard key={s.comp.id} suggestion={s} rank={i + 1} championName={data.championName} />
          ))}
        </section>
      </div>

      <footer className="app__footer">
        {data.source === 'set18' ? (
          <>
            Dados reais: <strong>{data.setName ?? 'set atual'}</strong>
            {data.patch && data.patch !== 'latest' ? ` (patch ${data.patch})` : ''} — {data.champions.length} campeões,{' '}
            {data.comps.length} comps. A lógica é desacoplada da fonte do estado.
          </>
        ) : (
          <>
            Dados de <strong>exemplo</strong> (fictícios) — rode <code>npm run import</code> pra trazer os dados reais do set
            atual. A lógica é desacoplada: hoje esta tela monta o estado; amanhã pode vir de visão computacional ou Overwolf.
          </>
        )}
      </footer>
    </div>
  );
}