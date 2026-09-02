import { describe, it, expect } from 'vitest';
import {
  loadData,
  suggestComps,
  COMPONENTS as C,
  ITEMS,
  type DataBundle,
  type Comp,
  type Item,
  type Champion,
} from '../src/core/index';

describe('loadData (fallback vs pacote gerado)', () => {
  it('CA-I4/CA-I6: pacote não-gerado (ou vazio) cai nas fixtures de exemplo', () => {
    const empty: DataBundle = { generated: false, items: [], champions: [], comps: [] };
    const data = loadData(empty);
    expect(data.source).toBe('example');
    expect(data.comps.length).toBeGreaterThan(0);
    // e o cérebro roda normalmente com esse loader
    const out = suggestComps({ units: [{ championId: 'jinx' }], components: [C.BF_SWORD, C.RECURVE_BOW] }, data.comps, {
      book: data.book,
      championName: data.championName,
    });
    expect(out[0].comp.id).toBe('snipers-jinx');
  });

  it('CA-I4: pacote gerado é usado (source=set18) e alimenta o scorer', () => {
    const items: Item[] = [{ id: ITEMS.GIANT_SLAYER, name: 'Giant Slayer', composition: [C.BF_SWORD, C.RECURVE_BOW] }];
    const champions: Champion[] = [
      { id: 'TFT18_Ahri', name: 'Ahri', cost: 4, traits: ['Blossom'] },
      { id: 'TFT18_Garen', name: 'Garen', cost: 1, traits: ['Bruiser'] },
    ];
    const comps: Comp[] = [
      {
        id: 'blossom-ahri',
        name: 'Blossom Ahri',
        avgPlacement: 3.9,
        units: [
          { championId: 'TFT18_Ahri', role: 'carry', items: [ITEMS.GIANT_SLAYER] },
          { championId: 'TFT18_Garen', role: 'flex' },
        ],
      },
    ];
    const bundle: DataBundle = { generated: true, setName: 'Enchanted Wilds', patch: '18.1', items, champions, comps };

    const data = loadData(bundle);
    expect(data.source).toBe('set18');
    expect(data.setName).toBe('Enchanted Wilds');
    expect(data.championName('TFT18_Ahri')).toBe('Ahri');

    const out = suggestComps({ units: [{ championId: 'TFT18_Ahri' }], components: [C.BF_SWORD, C.RECURVE_BOW] }, data.comps, {
      book: data.book,
      championName: data.championName,
    });
    expect(out[0].comp.id).toBe('blossom-ahri');
    expect(out[0].why.carryItems.find((i) => i.itemId === ITEMS.GIANT_SLAYER)?.status).toBe('complete');
  });
});
