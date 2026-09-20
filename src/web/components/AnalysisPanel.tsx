import { useEffect, useState } from 'react';
import type { ChampionId, CompSuggestion, HeldState } from '../../core/index';
import { analyze, type JevDecision } from '../../integrations/jev';
import type { Economy } from './BoardContext';
import { ResultCard } from './ResultCard';

interface Props {
  candidates: CompSuggestion[];
  held: HeldState;
  economy: Economy;
  championName: (id: ChampionId) => string;
}

// Camada híbrida: os candidatos vêm do core (determinístico); o Jev só escolhe
// entre eles e dá a confiança de commit. Sem Jev, cai no top-1 sem quebrar a tela.
export function AnalysisPanel({ candidates, held, economy, championName }: Props) {
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<JevDecision | null>(null);

  useEffect(() => {
    if (candidates.length === 0) return;
    let cancelled = false;
    setLoading(true);
    setDecision(null);
    analyze({ held, economy, candidates })
      .then((result) => {
        if (cancelled) return;
        setDecision(result);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setDecision(null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [held, economy, candidates]);

  if (candidates.length === 0) return null;

  const chosen = decision
    ? candidates.find((c) => c.comp.id === decision.chosenCompId) ?? candidates[0]
    : candidates[0];
  const confidence = decision ? Math.round(decision.commitConfidence) : 0;

  return (
    <section className="analysis">
      <div className="analysis__head">
        <h2>Análise</h2>
        {loading ? (
          <span className="analysis__loading">Analisando…</span>
        ) : decision ? (
          <span className="badge badge--jev">Jev recomenda</span>
        ) : (
          <span className="analysis__note">Análise determinística (Jev indisponível)</span>
        )}
      </div>

      {!loading && decision && (
        <div className="confidence">
          <span className="confidence__label">Confiança de commit</span>
          <span className="confidence__track">
            <span className="confidence__fill" style={{ width: `${confidence}%` }} />
          </span>
          <span className="confidence__pct">{confidence}%</span>
        </div>
      )}

      {!loading && (
        <div className="analysis__pick">
          <ResultCard suggestion={chosen} rank={1} championName={championName} />
        </div>
      )}

      {!loading && chosen.comp.levelingPlan && (
        <p className="analysis__plan">
          <span className="analysis__plan-label">Como usar:</span> {chosen.comp.levelingPlan}
        </p>
      )}
    </section>
  );
}
