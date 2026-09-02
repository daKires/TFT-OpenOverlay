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

  it('CA-I3: carry (top build) com itens do buildName mapeados; stars viram core', () => {
    expect(r.comps.length).toBe(1); // a comp só com unidade desconhecida é descartada
    const comp = r.comps[0];
    expect(comp.id).toBe('blossom-ahri');
    expect(comp.name).toBe('Blossom Ahri');

    const carry = comp.units.find((u) => u.role === 'carry')!;
    expect(carry.championId).toBe('TFT18_Ahri'); // "DA_18_Ahri" reconciliado por nome
    expect(carry.items).toEqual([ITEMS.GIANT_SLAYER, ITEMS.INFINITY_EDGE]); // emblema é descartado

    expect(comp.units.some((u) => u.role === 'core' && u.championId === 'TFT18_Garen')).toBe(true);
    expect(comp.avgPlacement).toBeCloseTo(3.11, 2);
  });

  it('CA-I3: referências não-casadas (unidade e emblema) são reportadas, não quebram', () => {
    expect(r.unmatched.units).toContain('DA_18_Unknown');
    expect(r.unmatched.items).toContain('DA_18_EmblemFae');
  });
});
