import type { Comp, CompTier } from '../types';
import { clamp, type ScoringOptions } from './weights';

const TIER_STRENGTH: Record<CompTier, number> = { S: 1, A: 0.75, B: 0.5, C: 0.25, D: 0 };

/**
 * Normaliza a força da comp em 0..1. Base = colocação média (menor = melhor;
 * ~4.5 = neutro). Sem avgPlacement, cai no tier. Sem nada, fica neutro (0.5).
 */
export function computeStrength01(comp: Comp, opts: ScoringOptions): number {
  let s: number;
  if (typeof comp.avgPlacement === 'number') {
    s = clamp((opts.neutralPlacement - comp.avgPlacement) / (opts.neutralPlacement - opts.bestPlacement), 0, 1);
    if (opts.shrinkSampleSize > 0 && typeof comp.sampleSize === 'number') {
      const k = comp.sampleSize / (comp.sampleSize + opts.shrinkSampleSize);
      s = k * s + (1 - k) * 0.5; // encolhe rumo ao neutro quando a amostra é pequena
    }
  } else if (comp.tier) {
    s = TIER_STRENGTH[comp.tier];
  } else {
    s = 0.5;
  }
  return s;
}

/** Fator multiplicativo que modula o encaixe (~1-spread .. 1+spread). */
export function strengthFactor(comp: Comp, opts: ScoringOptions): number {
  const s01 = computeStrength01(comp, opts);
  return 1 + opts.strengthSpread * (2 * s01 - 1);
}
