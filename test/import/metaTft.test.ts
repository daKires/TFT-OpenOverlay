import { describe, it, expect } from 'vitest';
import { parseCommunityDragon } from '../../scripts/import/communityDragon';
import { buildIndex, parseMetaTFT } from '../../scripts/import/metaTft';
import { ITEMS } from '../../src/core/index';
import cdragon from './samples/cdragon.sample.json';
import comps from './samples/metatft-comps.sample.json';
import stats from './samples/metatft-stats.sample.json';

describe('parseMetaTFT', () => {
  const index = buildIndex(parseCommunityDragon(cdragon));
  const r = parseMetaTFT(comps, stats, index);

  it('CA-I3: comps com carry+itens mapeados pros ids do CDragon, e avg do histograma', () => {
    expect(r.comps.length).toBe(1); // a comp com unidade desconhecida é descartada
    const comp = r.comps[0];
    expect(comp.id).toBe('blossom-ahri');
    const carry = comp.units.find((u) => u.role === 'carry')!;
    expect(carry.championId).toBe('TFT18_Ahri');
    expect(carry.items).toEqual([ITEMS.GIANT_SLAYER, ITEMS.INFINITY_EDGE]);
    expect(comp.avgPlacement).toBeCloseTo(3.11, 2);
    expect(comp.units.some((u) => u.role === 'core' && u.championId === 'TFT18_Garen')).toBe(true);
  });

  it('CA-I3: referências não-casadas são reportadas, não quebram', () => {
    expect(r.unmatched.units).toContain('TFT18_Unknown');
    expect(r.unmatched.items).toContain('Nonexistent Item');
  });
});
