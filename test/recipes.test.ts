import { describe, it, expect } from 'vitest';
import {
  createDefaultRecipeBook,
  COMPONENTS as C,
  ITEMS,
  pairKey,
} from '../src/core/index';

describe('receitas (ItemRecipeBook)', () => {
  const book = createDefaultRecipeBook();

  it('combina dois componentes independentemente da ordem', () => {
    const a = book.itemForComponents(C.BF_SWORD, C.RECURVE_BOW);
    const b = book.itemForComponents(C.RECURVE_BOW, C.BF_SWORD);
    expect(a?.id).toBe(ITEMS.GIANT_SLAYER);
    expect(a).toBe(b);
  });

  it('trata itens dobrados (componente + ele mesmo)', () => {
    expect(book.itemForComponents(C.BF_SWORD, C.BF_SWORD)?.id).toBe(ITEMS.DEATHBLADE);
    expect(book.componentsOf(ITEMS.DEATHBLADE)).toEqual([C.BF_SWORD, C.BF_SWORD]);
  });

  it('indexa itens por componente usado', () => {
    const ids = book.itemsUsing(C.BF_SWORD).map((i) => i.id);
    expect(ids).toContain(ITEMS.DEATHBLADE);
    expect(ids).toContain(ITEMS.GIANT_SLAYER);
  });

  it('pairKey é simétrico', () => {
    expect(pairKey(C.BF_SWORD, C.RECURVE_BOW)).toBe(pairKey(C.RECURVE_BOW, C.BF_SWORD));
  });
});
