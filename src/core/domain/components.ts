import type { ComponentId } from '../ids';
import type { Component } from '../types';

// Os 8 componentes base do TFT — invariantes entre sets. Chaveados pelo apiName
// do CommunityDragon, que é o que a fonte de dados real usa. (Spatula / Frying Pan
// produzem emblemas e mudam a cada set, então ficam de fora por enquanto.)

export const COMPONENTS = {
  BF_SWORD: 'TFT_Item_BFSword',
  RECURVE_BOW: 'TFT_Item_RecurveBow',
  NEEDLESSLY_LARGE_ROD: 'TFT_Item_NeedlesslyLargeRod',
  TEAR: 'TFT_Item_TearOfTheGoddess',
  CHAIN_VEST: 'TFT_Item_ChainVest',
  NEGATRON_CLOAK: 'TFT_Item_NegatronCloak',
  GIANTS_BELT: 'TFT_Item_GiantsBelt',
  SPARRING_GLOVES: 'TFT_Item_SparringGloves',
} as const satisfies Record<string, ComponentId>;

export const COMPONENT_LIST: Component[] = [
  { id: COMPONENTS.BF_SWORD, name: 'B.F. Sword', aliases: ['bf', 'espada', 'sword'] },
  { id: COMPONENTS.RECURVE_BOW, name: 'Recurve Bow', aliases: ['bow', 'arco', 'recurve'] },
  { id: COMPONENTS.NEEDLESSLY_LARGE_ROD, name: 'Needlessly Large Rod', aliases: ['rod', 'varinha', 'cajado'] },
  { id: COMPONENTS.TEAR, name: 'Tear of the Goddess', aliases: ['tear', 'lagrima', 'lágrima'] },
  { id: COMPONENTS.CHAIN_VEST, name: 'Chain Vest', aliases: ['vest', 'colete', 'chain'] },
  { id: COMPONENTS.NEGATRON_CLOAK, name: 'Negatron Cloak', aliases: ['cloak', 'manto', 'negatron'] },
  { id: COMPONENTS.GIANTS_BELT, name: "Giant's Belt", aliases: ['belt', 'cinto', 'giants'] },
  { id: COMPONENTS.SPARRING_GLOVES, name: 'Sparring Gloves', aliases: ['gloves', 'luvas', 'sparring'] },
];

const COMPONENT_BY_ID = new Map<ComponentId, Component>(COMPONENT_LIST.map((c) => [c.id, c]));

export function componentName(id: ComponentId): string {
  return COMPONENT_BY_ID.get(id)?.name ?? id;
}

// Índice de apelidos pra resolver entrada manual ("espada" -> BF Sword).
const ALIAS_INDEX: Map<string, ComponentId> = (() => {
  const m = new Map<string, ComponentId>();
  for (const c of COMPONENT_LIST) {
    m.set(c.name.toLowerCase(), c.id);
    m.set(c.id.toLowerCase(), c.id);
    for (const a of c.aliases ?? []) m.set(a.toLowerCase(), c.id);
  }
  return m;
})();

/** Resolve um texto livre num ComponentId, ou undefined se não reconhecer. */
export function resolveComponent(input: string): ComponentId | undefined {
  return ALIAS_INDEX.get(input.trim().toLowerCase());
}
