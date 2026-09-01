import type { ChampionId } from '../ids';
import type { Comp, HeldState } from '../types';
import type { ScoringOptions } from './weights';

export interface UnitOverlapResult {
  /** Fração ponderada das unidades da comp que o jogador tem (0..1). */
  score: number;
  matched: ChampionId[];
  /** Unidades carry/core da comp que faltam. */
  missingKey: ChampionId[];
}

/**
 * Overlap ponderado por papel: ter o carry vale MUITO mais que ter um flex.
 * (Os apps de referência usam carry ~3x um suporte.)
 */
export function computeUnitOverlap(comp: Comp, held: HeldState, opts: ScoringOptions): UnitOverlapResult {
  const heldIds = new Set(held.units.map((u) => u.championId));
  let totalWeight = 0;
  let matchedWeight = 0;
  const matched: ChampionId[] = [];
  const missingKey: ChampionId[] = [];

  for (const unit of comp.units) {
    const w = opts.roleWeights[unit.role];
    totalWeight += w;
    if (heldIds.has(unit.championId)) {
      matchedWeight += w;
      matched.push(unit.championId);
    } else if (unit.role === 'carry' || unit.role === 'core') {
      missingKey.push(unit.championId);
    }
  }

  return {
    score: totalWeight === 0 ? 0 : matchedWeight / totalWeight,
    matched,
    missingKey,
  };
}
