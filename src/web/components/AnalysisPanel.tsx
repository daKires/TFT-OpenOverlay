import { useEffect, useRef, useState } from 'react';
import type { Champion, ChampionId, CompSuggestion, HeldState } from '../../core/index';
import { analyze, type JevDecision } from '../../integrations/jev';
import type { Economy } from './BoardContext';
import { ResultCard } from './ResultCard';

interface Props {
  candidates: CompSuggestion[];
  held: HeldState;
  economy: Economy;
  champions: Champion[];
  championName: (id: ChampionId) => string;
}

// Abaixo disto o Jev é considerado pouco confiável e caímos no determinístico.
const MIN_CONFIDENCE = 40;

// Camada híbrida: os candidatos vêm do core (determinístico); o Jev só escolhe
// entre eles e dá a confiança de commit. Sem Jev, cai no top-1 sem quebrar a tela.
export function AnalysisPanel({ candidates, held, economy, champions, championName }: Props) {
  const [loading, setLoading] = useState(true); // só no primeiro cálculo (sem pick ainda)
  const [updating, setUpdating] = useState(false); // recálculo com pick já visível
  const [decision, setDecision] = useState<JevDecision | null>(null);
  const analyzedRef = useRef(false);

  useEffect(() => {
    if (candidates.length === 0) return;
    let cancelled = false;

    if (analyzedRef.current) setUpdating(true);
    else setLoading(true);

    const timer = setTimeout(() => {
      analyze({ held, economy, candidates, champions })
        .then((res) => {
          if (cancelled) return;
          setDecision(res);
          setLoading(false);
          setUpdating(false);
          analyzedRef.current = true;
        })
        .catch(() => {
          if (cancelled) return;
          setDecision(null);
          setLoading(false);
          setUpdating(false);
          analyzedRef.current = true;
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [held, economy, candidates, champions]);

  if (candidates.length === 0) return null;

  const jevTrusted = decision !== null && decision.commitConfidence >= MIN_CONFIDENCE;
  const lowConfidence = decision !== null && decision.commitConfidence < MIN_CONFIDENCE;

  const chosen = jevTrusted
    ? candidates.find((c) => c.comp.id === decision.chosenCompId) ?? candidates[0]
    : candidates[0];
  const confidence = decision ? Math.round(decision.commitConfidence) : 0;

  return (
    <section className="analysis">
      <div className="analysis__head">
        <h2>Análise</h2>
        <div className="analysis__status">
          {loading ? (
            <span className="analysis__loading">Analisando…</span>
          ) : jevTrusted ? (
            <span className="badge badge--jev">Jev recomenda</span>
          ) : lowConfidence ? (
            <span className="analysis__note analysis__note--warn">
              Confiança do Jev baixa — usando análise determinística
            </span>
          ) : (
            <span className="analysis__note">Análise determinística (Jev indisponível)</span>
          )}
          {updating && <span className="analysis__updating">atualizando…</span>}
        </div>
      </div>

      {!loading && jevTrusted && (
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