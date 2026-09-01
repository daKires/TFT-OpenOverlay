import { describe, it, expect } from 'vitest';
import {
  suggestComps,
  createDefaultRecipeBook,
  EXAMPLE_COMPS,
  championName,
  COMPONENTS as C,
  ITEMS,
  type Comp,
  type HeldState,
} from '../src/core/index';

const book = createDefaultRecipeBook();
const params = { book, championName };

describe('suggestComps (ponta a ponta)', () => {
  it('CA-07: devolve todas as comps, ordenadas por score desc, só o 1º é topPick', () => {
    const held: HeldState = { units: [{ championId: 'jinx' }], components: [C.BF_SWORD, C.RECURVE_BOW] };
    const out = suggestComps(held, EXAMPLE_COMPS, params);
    expect(out).toHaveLength(EXAMPLE_COMPS.length);
    for (let i = 1; i < out.length; i++) expect(out[i - 1].score).toBeGreaterThanOrEqual(out[i].score);
    expect(out.filter((s) => s.isTopPick)).toHaveLength(1);
    expect(out[0].isTopPick).toBe(true);
  });

  it('CA-06: estado vazio não quebra e devolve scores finitos', () => {
    const out = suggestComps({ units: [], components: [] }, EXAMPLE_COMPS, params);
    expect(out).toHaveLength(EXAMPLE_COMPS.length);
    for (const s of out) {
      expect(Number.isFinite(s.score)).toBe(true);
      expect(s.score).toBeGreaterThanOrEqual(0);
    }
  });

  it('CA-05: com encaixe igual, a comp mais forte (menor avg) fica na frente', () => {
    const base = (id: string, avg: number): Comp => ({
      id,
      name: id,
      avgPlacement: avg,
      units: [{ championId: 'x', role: 'carry' }],
    });
    const held: HeldState = { units: [{ championId: 'x' }], components: [] };
    const out = suggestComps(held, [base('fraca', 4.4), base('forte', 3.6)], params);
    expect(out[0].comp.id).toBe('forte');
  });

  it('ter o carry + montar o item do carry coloca a comp no topo', () => {
    const held: HeldState = { units: [{ championId: 'jinx' }], components: [C.BF_SWORD, C.RECURVE_BOW] };
    const out = suggestComps(held, EXAMPLE_COMPS, params);
    expect(out[0].comp.id).toBe('snipers-jinx');
    const gs = out[0].why.carryItems.find((i) => i.itemId === ITEMS.GIANT_SLAYER);
    expect(gs?.status).toBe('complete');
    expect(out[0].explanation).toContain('Giant Slayer');
  });

  it('detecta "falta 1 componente" no cenário real', () => {
    const held: HeldState = { units: [{ championId: 'jinx' }], components: [C.BF_SWORD] };
    const out = suggestComps(held, EXAMPLE_COMPS, params);
    const jinx = out.find((s) => s.comp.id === 'snipers-jinx')!;
    const gs = jinx.why.carryItems.find((i) => i.itemId === ITEMS.GIANT_SLAYER)!;
    expect(gs.status).toBe('one-away');
    expect(gs.missing).toContain(C.RECURVE_BOW);
  });
});
