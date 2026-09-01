import { describe, it, expect } from 'vitest';
import {
  EXAMPLE_COMPS,
  EXAMPLE_CHAMPIONS,
  createDefaultRecipeBook,
  COMPONENTS,
} from '../src/core/index';

describe('validade das fixtures', () => {
  const book = createDefaultRecipeBook();
  const championIds = new Set(EXAMPLE_CHAMPIONS.map((c) => c.id));
  const componentIds = new Set<string>(Object.values(COMPONENTS));

  it('toda unidade de toda comp existe na lista de campeões', () => {
    for (const comp of EXAMPLE_COMPS) {
      for (const u of comp.units) {
        expect(championIds.has(u.championId), `${comp.id}: ${u.championId}`).toBe(true);
      }
    }
  });

  it('toda comp tem ao menos 1 carry, e todo carry tem BiS', () => {
    for (const comp of EXAMPLE_COMPS) {
      const carries = comp.units.filter((u) => u.role === 'carry');
      expect(carries.length, `${comp.id} sem carry`).toBeGreaterThanOrEqual(1);
      for (const carry of carries) expect((carry.items ?? []).length, `${comp.id}/${carry.championId} sem BiS`).toBeGreaterThan(0);
    }
  });

  it('todo item de BiS existe no recipe book', () => {
    for (const comp of EXAMPLE_COMPS) {
      for (const u of comp.units) {
        for (const itemId of u.items ?? []) {
          expect(book.getItem(itemId), `${comp.id}: item ${itemId}`).toBeDefined();
        }
      }
    }
  });

  it('toda receita usa só os 8 componentes conhecidos', () => {
    for (const item of book.allItems()) {
      for (const c of item.composition) {
        expect(componentIds.has(c), `${item.id}: ${c}`).toBe(true);
      }
    }
  });
});
