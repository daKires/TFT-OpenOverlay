// API pública do "cérebro" (camada 1). Import típico:
//   import { suggestComps, createDefaultRecipeBook, EXAMPLE_COMPS } from './core';

// Tipos de domínio e resultado
export type {
  ChampionId,
  ComponentId,
  ItemId,
  TraitId,
} from './ids';
export type {
  Champion,
  Component,
  Item,
  Comp,
  CompUnit,
  CompTier,
  UnitRole,
  HeldState,
  HeldUnit,
  UnitLocation,
  CompSuggestion,
  ScoreBreakdown,
  SuggestionWhy,
  ItemProgress,
  ItemStatus,
} from './types';

// Função principal + opções
export { suggestComps, type SuggestParams } from './scoring/suggestComps';
export {
  DEFAULT_OPTIONS,
  resolveOptions,
  type ScoringOptions,
} from './scoring/weights';

// Sub-scores (úteis pra testar/depurar isolado)
export { computeUnitOverlap } from './scoring/unitOverlap';
export { computeItemBuildability } from './scoring/itemBuildability';
export { computeStrength01, strengthFactor } from './scoring/metaStrength';
export { explain, type NameResolver } from './scoring/explain';

// Interfaces plugáveis + implementações em memória
export type { CompRepository } from './repository/CompRepository';
export { createInMemoryCompRepository } from './repository/inMemoryCompRepository';
export type { ItemRecipeBook } from './items/ItemRecipeBook';
export { createInMemoryRecipeBook } from './items/inMemoryRecipeBook';
export { canonicalizePair, pairKey } from './items/recipes';

// Componentes base + resolvedor de nomes/apelidos
export {
  COMPONENTS,
  COMPONENT_LIST,
  componentName,
  resolveComponent,
} from './domain/components';

// Dados de exemplo (fixtures)
export { ITEMS, ITEM_LIST, createDefaultRecipeBook } from './fixtures/items';
export { EXAMPLE_COMPS } from './fixtures/comps';
export { EXAMPLE_CHAMPIONS, championName, getChampion } from './fixtures/champions';
