import type { ChampionId, ComponentId, ItemId, TraitId } from './ids';

// ---------------------------------------------------------------------------
// Modelo de domínio
// ---------------------------------------------------------------------------

/** Papel de uma unidade dentro de uma comp. Guia o peso no overlap de unidades. */
export type UnitRole = 'carry' | 'core' | 'flex';

export type CompTier = 'S' | 'A' | 'B' | 'C' | 'D';

export interface Champion {
  id: ChampionId;
  name: string;
  cost: 1 | 2 | 3 | 4 | 5;
  traits?: TraitId[];
}

/** Um componente base (ex. B.F. Sword). Os 8 core são invariantes entre sets. */
export interface Component {
  id: ComponentId;
  name: string;
  /** Apelidos aceitos na entrada manual (ex. 'espada', 'bf'). */
  aliases?: string[];
}

/**
 * Um item completo. `composition` é o par NÃO-ORDENADO de componentes que o monta.
 * Itens "dobrados" (ex. Deathblade = B.F. Sword + B.F. Sword) têm os dois iguais.
 */
export interface Item {
  id: ItemId;
  name: string;
  composition: [ComponentId, ComponentId];
}

export interface CompUnit {
  championId: ChampionId;
  role: UnitRole;
  /** Itens ideais (BiS) por ordem de prioridade — normalmente só o carry tem. */
  items?: ItemId[];
  starTarget?: 1 | 2 | 3;
}

export interface Comp {
  id: string;
  /** Convenção dos apps: "<trait core> + <carry>". */
  name: string;
  units: CompUnit[];
  /** Colocação média (menor = melhor; ~4.5 = neutro num lobby de 8). */
  avgPlacement?: number;
  tier?: CompTier;
  top4Rate?: number;
  sampleSize?: number;
  levelingPlan?: string;
  difficulty?: number;
}

// ---------------------------------------------------------------------------
// Estado do jogador (a ENTRADA da camada 1). Simples de propósito: não sabe de
// onde veio (UI hoje; CV / Overwolf / Live Client amanhã).
// ---------------------------------------------------------------------------

export type UnitLocation = 'board' | 'bench';

export interface HeldUnit {
  championId: ChampionId;
  location?: UnitLocation;
  star?: 1 | 2 | 3;
}

export interface HeldState {
  units: HeldUnit[];
  /** Componentes soltos. Repetição = multiset (2 B.F. Sword = [bf, bf]). */
  components: ComponentId[];
  /** Itens já montados (contam como prontos sem consumir componentes). */
  completedItems?: ItemId[];
}

// ---------------------------------------------------------------------------
// Resultado do scoring
// ---------------------------------------------------------------------------

export type ItemStatus = 'complete' | 'one-away' | 'far';

export interface ItemProgress {
  itemId: ItemId;
  itemName: string;
  status: ItemStatus;
  /** Componentes que ainda faltam pra completar o item. */
  missing: ComponentId[];
}

export interface ScoreBreakdown {
  /** Sobreposição de unidades, ponderada por papel (0..1). */
  unitOverlap: number;
  /** Quanto os componentes montam os itens do carry (0..1). */
  itemBuildability: number;
  /** Fator de força no meta que modula o encaixe (~0.85..1.15). */
  metaStrength: number;
  /** Encaixe = combinação de unidades + itens (0..1). */
  fit: number;
}

export interface SuggestionWhy {
  matchedUnits: ChampionId[];
  /** Unidades carry/core da comp que você ainda não tem. */
  missingKeyUnits: ChampionId[];
  carryItems: ItemProgress[];
}

export interface CompSuggestion {
  comp: Comp;
  score: number;
  isTopPick: boolean;
  breakdown: ScoreBreakdown;
  why: SuggestionWhy;
  /** Frase legível (PT-BR) explicando o encaixe. */
  explanation: string;
}
