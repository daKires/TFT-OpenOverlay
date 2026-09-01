import type { UnitRole } from '../types';

/**
 * Todos os "botões" do scoring num lugar só. Nada aqui é mágico: são pesos que
 * dá pra tunar. Os padrões batem com o que os apps de referência fazem
 * (carry pesa muito mais; encaixe manda; força só desempata).
 */
export interface ScoringOptions {
  /** Peso de cada papel no overlap de unidades. */
  roleWeights: Record<UnitRole, number>;
  /** Peso de cada item do BiS por posição (#1 vale mais que #3). */
  itemPriorityWeights: number[];
  /** Crédito quando falta 1 componente pra montar um item (0..1). */
  partialCredit: number;
  /** Como dividir o "encaixe" entre unidades e itens (somam ~1). */
  fitWeights: { units: number; items: number };
  /** Como combinar encaixe e força. */
  blend: 'modulation' | 'linear';
  /** Amplitude do fator de força no modo 'modulation' (0.15 => ~0.85..1.15). */
  strengthSpread: number;
  /** Peso da força no modo 'linear'. */
  linearStrengthWeight: number;
  /** Colocação média considerada neutra (força mínima). */
  neutralPlacement: number;
  /** Colocação média considerada "topo" (força máxima). */
  bestPlacement: number;
  /** Encolhe comps com amostra pequena rumo ao neutro (0 = desligado). */
  shrinkSampleSize: number;
}

export const DEFAULT_OPTIONS: ScoringOptions = {
  roleWeights: { carry: 3, core: 1.5, flex: 1 },
  itemPriorityWeights: [1, 0.8, 0.6],
  partialCredit: 0.5,
  fitWeights: { units: 0.5, items: 0.5 },
  blend: 'modulation',
  strengthSpread: 0.15,
  linearStrengthWeight: 0.2,
  neutralPlacement: 4.5,
  bestPlacement: 3.0,
  shrinkSampleSize: 0,
};

export function resolveOptions(opts?: Partial<ScoringOptions>): ScoringOptions {
  return {
    ...DEFAULT_OPTIONS,
    ...opts,
    roleWeights: { ...DEFAULT_OPTIONS.roleWeights, ...(opts?.roleWeights ?? {}) },
    fitWeights: { ...DEFAULT_OPTIONS.fitWeights, ...(opts?.fitWeights ?? {}) },
    itemPriorityWeights: opts?.itemPriorityWeights ?? DEFAULT_OPTIONS.itemPriorityWeights,
  };
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}
