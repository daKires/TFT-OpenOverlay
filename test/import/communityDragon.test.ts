import { describe, it, expect } from 'vitest';
import { parseCommunityDragon } from '../../scripts/import/communityDragon';
import { ITEMS, COMPONENTS as C } from '../../src/core/index';
import sample from './samples/cdragon.sample.json';

describe('parseCommunityDragon', () => {
  const r = parseCommunityDragon(sample);

  it('CA-I2: pega o set de maior número', () => {
    expect(r.setNumber).toBe(18);
    expect(r.setName).toBe('Enchanted Wilds');
  });

  it('CA-I1: itens completos = par de 2 componentes base (exclui emblema/artefato/componente)', () => {
    const ids = r.items.map((i) => i.id);
    expect(ids).toContain(ITEMS.DEATHBLADE);
    expect(ids).toContain(ITEMS.GIANT_SLAYER);
    expect(ids).not.toContain('TFT18_Item_BlossomEmblem'); // Spatula não é componente base
    expect(r.items.length).toBe(3);
    const gs = r.items.find((i) => i.id === ITEMS.GIANT_SLAYER)!;
    expect(gs.composition).toEqual([C.BF_SWORD, C.RECURVE_BOW]);
  });

  it('CA-I2: só campeões reais do set (prefixo TFT<n>_), sem boneco custo 0 nem summon', () => {
    const ids = r.champions.map((c) => c.id);
    expect(ids).toContain('TFT18_Ahri');
    expect(ids).not.toContain('TFT18_Dummy'); // custo 0
    expect(ids).not.toContain('TFT_BlueGolem'); // summon: sem prefixo TFT18_
    const ahri = r.champions.find((c) => c.id === 'TFT18_Ahri')!;
    expect(ahri.cost).toBe(4);
    expect(ahri.traits).toContain('Blossom');
    expect(r.traits.map((t) => t.name)).toContain('Blossom');
  });
});
