import { describe, it, expect } from 'vitest';
import { computeUnitOverlap, resolveOptions, type Comp } from '../src/core/index';

const opts = resolveOptions();
const comp: Comp = {
  id: 'c',
  name: 'c',
  units: [
    { championId: 'carry', role: 'carry' },
    { championId: 'core1', role: 'core' },
    { championId: 'flex1', role: 'flex' },
    { championId: 'flex2', role: 'flex' },
  ],
};

describe('unitOverlap', () => {
  it('CA-04: ter o carry vale mais que ter um flex', () => {
    const withCarry = computeUnitOverlap(comp, { units: [{ championId: 'carry' }], components: [] }, opts);
    const withFlex = computeUnitOverlap(comp, { units: [{ championId: 'flex1' }], components: [] }, opts);
    expect(withCarry.score).toBeGreaterThan(withFlex.score);
  });

  it('reporta o carry ausente como peça-chave faltando', () => {
    const r = computeUnitOverlap(comp, { units: [{ championId: 'flex1' }], components: [] }, opts);
    expect(r.missingKey).toContain('carry');
    expect(r.matched).toEqual(['flex1']);
  });

  it('overlap total quando o jogador tem todas as unidades', () => {
    const r = computeUnitOverlap(
      comp,
      { units: comp.units.map((u) => ({ championId: u.championId })), components: [] },
      opts,
    );
    expect(r.score).toBe(1);
  });
});
