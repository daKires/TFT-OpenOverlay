import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  analyze,
  buildAnalysisState,
  type AnalyzeParams,
} from '../src/integrations/jev';
import {
  suggestComps,
  createDefaultRecipeBook,
  EXAMPLE_COMPS,
  EXAMPLE_CHAMPIONS,
  championName,
  COMPONENTS as C,
  type HeldState,
} from '../src/core/index';

const book = createDefaultRecipeBook();
const held: HeldState = { units: [{ championId: 'jinx' }], components: [C.BF_SWORD, C.RECURVE_BOW] };
const economy = { gold: 30, level: 7, stage: '3-2', hp: 64 };
const candidates = suggestComps(held, EXAMPLE_COMPS, { book, championName });
const params: AnalyzeParams = { held, economy, candidates, champions: EXAMPLE_CHAMPIONS };

function okResponse(payload: unknown): Response {
  return { ok: true, status: 200, json: async () => payload } as unknown as Response;
}
function badResponse(): Response {
  return { ok: false, status: 500, json: async () => ({}) } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('buildAnalysisState', () => {
  it('serializa tabuleiro, economia e candidatos em JSON legível', () => {
    const json = buildAnalysisState(held, economy, candidates, EXAMPLE_CHAMPIONS);
    const state = JSON.parse(json);
    expect(state.board.units[0].championId).toBe('jinx');
    expect(state.board.components).toEqual([C.BF_SWORD, C.RECURVE_BOW]);
    expect(state.economy).toEqual({ gold: 30, level: 7, stage: '3-2', hp: 64 });
    expect(state.candidates).toHaveLength(candidates.length);
    expect(state.candidates[0].id).toBe(candidates[0].comp.id);
    expect(typeof state.candidates[0].breakdown.unitOverlap).toBe('number');
    expect(typeof state.candidates[0].breakdown.itemBuildability).toBe('number');
    expect(json).toContain('\n');
  });

  it('enriquece o state com nome/traits das unidades e held/fit por candidato', () => {
    const state = JSON.parse(buildAnalysisState(held, economy, candidates, EXAMPLE_CHAMPIONS));
    expect(typeof state.board.units[0].name).toBe('string');
    expect(Array.isArray(state.board.units[0].traits)).toBe(true);
    const cand = state.candidates[0];
    expect(typeof cand.fit).toBe('number');
    expect(Array.isArray(cand.units)).toBe(true);
    expect(typeof cand.units[0].name).toBe('string');
    expect(typeof cand.units[0].held).toBe('boolean');
    // held reflete why.matchedUnits: nenhuma unidade da comp fora das matched pode vir true.
    const matched = new Set(candidates[0].why.matchedUnits);
    const heldUnits = candidates[0].comp.units.filter((_, i) => cand.units[i].held);
    expect(heldUnits.every((u) => matched.has(u.championId))).toBe(true);
  });
});

describe('analyze (Jev)', () => {
  it('envia model, state e as duas questions com tipos e options corretos', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) =>
      okResponse({
        answers: {
          which_comp: { type: 'choice', choice: candidates[0].comp.id, probabilities: { [candidates[0].comp.id]: 1 } },
          commit_confidence: { type: 'score', score: 0.5 },
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await analyze(params);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/jev');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');

    const body = JSON.parse(init.body as string);
    expect(body.model).toBe('jev-latest');
    expect(typeof body.state).toBe('string');
    expect(body.questions.which_comp.type).toBe('choice');
    expect(body.questions.which_comp.options).toEqual(candidates.map((c) => c.comp.id));
    // criteria é obrigatório: dict por opção no choice, lista de níveis no score.
    expect(Object.keys(body.questions.which_comp.criteria).sort()).toEqual(
      candidates.map((c) => c.comp.id).sort(),
    );
    expect(body.questions.commit_confidence.type).toBe('score');
    expect(Array.isArray(body.questions.commit_confidence.criteria)).toBe(true);
    expect(body.questions.commit_confidence.criteria.length).toBeGreaterThan(0);
  });

  it('parseia a resposta real: usa choice, distribui probabilities e converte score 0..1 em %', async () => {
    const ids = candidates.map((c) => c.comp.id);
    const chosen = ids[1];
    const other = ids[0];
    const probabilities = { [other]: 0.25, [chosen]: 0.75 };
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        okResponse({
          model: 'jev-1.13.0',
          answers: {
            which_comp: { type: 'choice', choice: chosen, confidence: 0.8, probabilities },
            commit_confidence: { type: 'score', score: 0.82, confidence: 0.44 },
          },
        }),
      ),
    );

    const out = await analyze(params);
    expect(out).not.toBeNull();
    expect(out!.chosenCompId).toBe(chosen);
    expect(out!.commitConfidence).toBe(82);
    expect(out!.distribution).toEqual(probabilities);
  });

  it('retorna null quando o fetch responde não-ok', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => badResponse()));
    expect(await analyze(params)).toBeNull();
  });

  it('retorna null quando o fetch rejeita', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('rede indisponível');
      }),
    );
    expect(await analyze(params)).toBeNull();
  });

  it('retorna null quando a escolha do Jev não está entre os candidatos', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        okResponse({
          answers: {
            which_comp: { type: 'choice', choice: 'comp-inexistente', probabilities: { 'comp-inexistente': 1 } },
            commit_confidence: { type: 'score', score: 0.9 },
          },
        }),
      ),
    );
    expect(await analyze(params)).toBeNull();
  });
});
