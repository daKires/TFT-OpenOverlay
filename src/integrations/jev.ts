import type { CompSuggestion, HeldState } from '../core/index';

// Integração com o Jev (TypeSafe AI). Fica FORA de src/core: o núcleo é puro e
// não sabe da existência disto. Só importamos TIPOS do core.

const JEV_ENDPOINT = '/api/jev';
const JEV_MODEL = 'jev-latest';

// ---------------------------------------------------------------------------
// Questions enviadas ao Jev
// ---------------------------------------------------------------------------

export interface JevChoiceQuestion {
  type: 'choice';
  options: string[];
}

export interface JevScoreQuestion {
  type: 'score';
  min: number;
  max: number;
}

export type JevQuestion = JevChoiceQuestion | JevScoreQuestion;

export interface JevRequest {
  model: string;
  state: string;
  questions: Record<string, JevQuestion>;
}

// ---------------------------------------------------------------------------
// Resposta do Jev
// ---------------------------------------------------------------------------

export interface JevQuestionAnswer {
  type?: string;
  /** choice: opção -> probabilidade. */
  distribution?: Record<string, number>;
  probabilities?: Record<string, number>;
  /** score: valor único. */
  value?: number;
  score?: number;
}

export interface JevResponse {
  answers?: Record<string, JevQuestionAnswer>;
  output?: Record<string, JevQuestionAnswer>;
}

// ---------------------------------------------------------------------------
// Estado enviado (contexto) + decisão devolvida
// ---------------------------------------------------------------------------

export interface JevEconomy {
  gold?: number;
  level?: number;
  stage?: string;
  hp?: number;
}

export interface AnalyzeParams {
  held: HeldState;
  economy: JevEconomy;
  candidates: CompSuggestion[];
}

export interface JevDecision {
  chosenCompId: string;
  distribution: Record<string, number>;
  commitConfidence: number;
}

/**
 * Serializa em JSON legível o contexto que o Jev recebe: o tabuleiro (unidades
 * e peças), a economia e os candidatos gerados pelo core (determinístico).
 */
export function buildAnalysisState(
  held: HeldState,
  economy: JevEconomy,
  candidates: CompSuggestion[],
): string {
  const state = {
    board: {
      units: held.units.map((u) => ({
        championId: u.championId,
        location: u.location ?? 'board',
        star: u.star ?? 1,
      })),
      components: [...held.components],
      completedItems: [...(held.completedItems ?? [])],
    },
    economy: {
      gold: economy.gold ?? null,
      level: economy.level ?? null,
      stage: economy.stage ?? null,
      hp: economy.hp ?? null,
    },
    candidates: candidates.map((s) => ({
      id: s.comp.id,
      name: s.comp.name,
      tier: s.comp.tier ?? null,
      avgPlacement: s.comp.avgPlacement ?? null,
      breakdown: {
        unitOverlap: s.breakdown.unitOverlap,
        itemBuildability: s.breakdown.itemBuildability,
      },
    })),
  };
  return JSON.stringify(state, null, 2);
}

/**
 * Pede ao Jev que escolha a comp e a confiança de commit. Em qualquer falha
 * (rede, resposta não-ok, payload inválido ou escolha fora dos candidatos)
 * devolve null — sinal para o chamador cair no top-1 determinístico.
 */
export async function analyze({ held, economy, candidates }: AnalyzeParams): Promise<JevDecision | null> {
  if (candidates.length === 0) return null;

  const body: JevRequest = {
    model: JEV_MODEL,
    state: buildAnalysisState(held, economy, candidates),
    questions: {
      which_comp: { type: 'choice', options: candidates.map((c) => c.comp.id) },
      commit_confidence: { type: 'score', min: 0, max: 100 },
    },
  };

  let res: Response;
  try {
    res = await fetch(JEV_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;

  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    return null;
  }

  const answers = extractAnswers(raw);
  const distribution = readDistribution(answers.which_comp);
  const entries = Object.entries(distribution);
  if (entries.length === 0) return null;

  const [chosenCompId] = entries.reduce((best, cur) => (cur[1] > best[1] ? cur : best));
  const ids = new Set(candidates.map((c) => c.comp.id));
  if (!ids.has(chosenCompId)) return null;

  const commitConfidence = clamp(readScore(answers.commit_confidence) ?? 0, 0, 100);
  return { chosenCompId, distribution, commitConfidence };
}

// ---------------------------------------------------------------------------
// Parsing tolerante
// ---------------------------------------------------------------------------

function extractAnswers(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return {};
  const obj = raw as Record<string, unknown>;
  const container = obj.answers ?? obj.output ?? obj.results ?? obj;
  if (!container || typeof container !== 'object') return {};
  return container as Record<string, unknown>;
}

function readDistribution(answer: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!answer || typeof answer !== 'object') return out;
  const a = answer as Record<string, unknown>;
  const src = a.distribution ?? a.probabilities ?? a.options ?? a.scores;

  if (Array.isArray(src)) {
    for (const item of src) {
      if (!item || typeof item !== 'object') continue;
      const it = item as Record<string, unknown>;
      const keyRaw = it.option ?? it.label ?? it.id ?? it.name ?? it.value;
      const probRaw = it.probability ?? it.prob ?? it.score ?? it.weight ?? it.value;
      const key = typeof keyRaw === 'string' ? keyRaw : null;
      const n = typeof probRaw === 'number' ? probRaw : Number(probRaw);
      if (key && Number.isFinite(n)) out[key] = n;
    }
    return out;
  }

  if (src && typeof src === 'object') {
    for (const [k, v] of Object.entries(src as Record<string, unknown>)) {
      const n = typeof v === 'number' ? v : Number(v);
      if (Number.isFinite(n)) out[k] = n;
    }
  }
  return out;
}

function readScore(answer: unknown): number | null {
  if (typeof answer === 'number') return answer;
  if (!answer || typeof answer !== 'object') return null;
  const a = answer as Record<string, unknown>;
  const raw = a.value ?? a.score ?? a.confidence ?? a.result;
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
