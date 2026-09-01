import type { ComponentId, ItemId } from '../ids';
import type { Item } from '../types';
import type { ItemRecipeBook } from './ItemRecipeBook';
import { pairKey } from './recipes';

/** Constrói um ItemRecipeBook em memória a partir de uma lista de itens. */
export function createInMemoryRecipeBook(items: Item[]): ItemRecipeBook {
  const byId = new Map<ItemId, Item>();
  const byPair = new Map<string, Item>();
  const usingComponent = new Map<ComponentId, Item[]>();

  for (const item of items) {
    byId.set(item.id, item);
    const [a, b] = item.composition;
    byPair.set(pairKey(a, b), item);
    for (const c of new Set(item.composition)) {
      const arr = usingComponent.get(c) ?? [];
      arr.push(item);
      usingComponent.set(c, arr);
    }
  }

  return {
    getItem: (id) => byId.get(id),
    allItems: () => [...byId.values()],
    itemForComponents: (a, b) => byPair.get(pairKey(a, b)),
    componentsOf: (id) => byId.get(id)?.composition,
    itemsUsing: (c) => usingComponent.get(c) ?? [],
  };
}
