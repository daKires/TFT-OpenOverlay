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
  championName,
  COMPONENTS as C,
  type HeldState,
} from '../src/core/index';

const book = createDefaultRecipeBook();
const held: HeldState = { units: [{ championId: 'jinx' }], components: [C.BF_SWORD, C.RECURVE_BOW] };
const economy = { gold: 30, level: 7, stage: '3-2', hp: 64 };
const candidates = suggestComps(held, EXAMPLE_COMPS, { book, championName });
const params: AnalyzeParams = { held, economy, candidates };

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
    const json = buildAnalysisState(held, economy, candidates);
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
});

describe('analyze (Jev)', () => {
  it('envia model, state e as duas questions com tipos e options corretos', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) =>
      okResponse({
        answers: {
          which_comp: { type: 'choice', distribution: { [candidates[0].comp.id]: 1 } },
          commit_confidence: { type: 'score', value: 50 },
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
    expect(body.questions.commit_confidence.type).toBe('score');
    expect(body.questions.commit_confidence.min).toBe(0);
    expect(body.questions.commit_confidence.max).toBe(100);
  });

  it('parseia a resposta: escolhe a opção de maior probabilidade e lê a confiança', async () => {
    const ids = candidates.map((c) => c.comp.id);
    const chosen = ids[1];
    const other = ids[0];
    const distribution = { [other]: 0.25, [chosen]: 0.75 };
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        okResponse({
          answers: {
            which_comp: { type: 'choice', distribution },
            commit_confidence: { type: 'score', value: 82 },
          },
        }),
      ),
    );

    const out = await analyze(params);
    expect(out).not.toBeNull();
    expect(out!.chosenCompId).toBe(chosen);
    expect(out!.commitConfidence).toBe(82);
    expect(out!.distribution).toEqual(distribution);
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
            which_comp: { type: 'choice', distribution: { 'comp-inexistente': 1 } },
            commit_confidence: { type: 'score', value: 90 },
          },
        }),
      ),
    );
    expect(await analyze(params)).toBeNull();
  });
});
