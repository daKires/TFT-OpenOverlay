import { describe, it, expect } from 'vitest';
import { computeStrength01, strengthFactor, resolveOptions, type Comp } from '../src/core/index';

const opts = resolveOptions();
const comp = (over: Partial<Comp>): Comp => ({ id: 'c', name: 'c', units: [], ...over });

describe('metaStrength', () => {
  it('colocação média menor => mais forte (fator maior)', () => {
    const strong = strengthFactor(comp({ avgPlacement: 3.9 }), opts);
    const weak = strengthFactor(comp({ avgPlacement: 4.4 }), opts);
    expect(strong).toBeGreaterThan(weak);
  });

  it('strength01 fica sempre entre 0 e 1', () => {
    for (const avg of [2.5, 3.0, 3.8, 4.5, 5.5]) {
      const s = computeStrength01(comp({ avgPlacement: avg }), opts);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(1);
    }
  });

  it('usa o tier quando não há avgPlacement', () => {
    expect(computeStrength01(comp({ tier: 'S' }), opts)).toBeGreaterThan(computeStrength01(comp({ tier: 'C' }), opts));
  });

  it('sem dado de força => neutro (fator 1)', () => {
    expect(strengthFactor(comp({}), opts)).toBeCloseTo(1, 5);
  });
});
