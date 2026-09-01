import type { ComponentId, ItemId } from '../ids';
import type { Item } from '../types';

/**
 * Fonte de receitas de item, PLUGÁVEL. Hoje: uma implementação em memória com
 * dados de exemplo. Amanhã: um loader do CommunityDragon (campo `composition`),
 * sem tocar no scorer. É o mesmo padrão de desacoplamento do CompRepository.
 */
export interface ItemRecipeBook {
  getItem(id: ItemId): Item | undefined;
  allItems(): Item[];
  /** Item resultante de combinar dois componentes (ordem não importa). */
  itemForComponents(a: ComponentId, b: ComponentId): Item | undefined;
  /** Os dois componentes que compõem um item. */
  componentsOf(id: ItemId): [ComponentId, ComponentId] | undefined;
  /** Itens que usam um dado componente. */
  itemsUsing(component: ComponentId): Item[];
}
