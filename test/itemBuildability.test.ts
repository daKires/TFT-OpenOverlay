import { describe, it, expect } from 'vitest';
import {
  createInMemoryRecipeBook,
  computeItemBuildability,
  resolveOptions,
  COMPONENTS as C,
  type Comp,
  type Item,
} from '../src/core/index';

const DEATHBLADE = 'X_Deathblade';
const GIANT_SLAYER = 'X_GiantSlayer';
const INFINITY_EDGE = 'X_InfinityEdge';

const items: Item[] = [
  { id: DEATHBLADE, name: 'Deathblade', composition: [C.BF_SWORD, C.BF_SWORD] },
  { id: GIANT_SLAYER, name: 'Giant Slayer', composition: [C.BF_SWORD, C.RECURVE_BOW] },
  { id: INFINITY_EDGE, name: 'Infinity Edge', composition: [C.BF_SWORD, C.SPARRING_GLOVES] },
];
const book = createInMemoryRecipeBook(items);
const opts = resolveOptions();

function compWithCarryItems(itemIds: string[]): Comp {
  return { id: 'c', name: 'c', units: [{ championId: 'carry', role: 'carry', items: itemIds }] };
}

describe('itemBuildability', () => {
  it('CA-01: item montável agora conta como completo (score cheio)', () => {
    const r = computeItemBuildability(compWithCarryItems([DEATHBLADE]), { units: [], components: [C.BF_SWORD, C.BF_SWORD] }, book, opts);
    expect(r.score).toBe(1);
    expect(r.progress.find((p) => p.itemId === DEATHBLADE)?.status).toBe('complete');
  });

  it('CA-02 + CA-09: falta 1 componente => one-away e meio ponto (multiset importa)', () => {
    const r = computeItemBuildability(compWithCarryItems([DEATHBLADE]), { units: [], components: [C.BF_SWORD] }, book, opts);
    const p = r.progress.find((x) => x.itemId === DEATHBLADE)!;
    expect(p.status).toBe('one-away');
    expect(p.missing).toEqual([C.BF_SWORD]); // falta a 2ª B.F. Sword
    expect(r.score).toBeCloseTo(0.5, 5);
  });

  it('CA-03: componente compartilhado não é contado duas vezes', () => {
    const r = computeItemBuildability(compWithCarryItems([GIANT_SLAYER, INFINITY_EDGE]), { units: [], components: [C.BF_SWORD] }, book, opts);
    const oneAway = r.progress.filter((p) => p.status === 'one-away');
    const far = r.progress.filter((p) => p.status === 'far');
    expect(oneAway).toHaveLength(1); // só UM item ganha crédito pela única B.F. Sword
    expect(far).toHaveLength(1);
  });

  it('prefere COMPLETAR um item a espalhar créditos parciais', () => {
    const r = computeItemBuildability(
      compWithCarryItems([GIANT_SLAYER, INFINITY_EDGE]),
      { units: [], components: [C.BF_SWORD, C.RECURVE_BOW, C.SPARRING_GLOVES] },
      book,
      opts,
    );
    expect(r.progress.find((p) => p.itemId === GIANT_SLAYER)?.status).toBe('complete');
    expect(r.progress.find((p) => p.itemId === INFINITY_EDGE)?.status).toBe('one-away');
  });

  it('CA-08: item já montado (completedItems) conta sem consumir componentes', () => {
    const r = computeItemBuildability(
      compWithCarryItems([DEATHBLADE]),
      { units: [], components: [], completedItems: [DEATHBLADE] },
      book,
      opts,
    );
    expect(r.score).toBe(1);
    expect(r.progress.find((p) => p.itemId === DEATHBLADE)?.status).toBe('complete');
  });

  it('comp sem itens de carry => buildability 0', () => {
    const comp: Comp = { id: 'c', name: 'c', units: [{ championId: 'a', role: 'core' }] };
    const r = computeItemBuildability(comp, { units: [], components: [C.BF_SWORD] }, book, opts);
    expect(r.score).toBe(0);
    expect(r.progress).toHaveLength(0);
  });
});
