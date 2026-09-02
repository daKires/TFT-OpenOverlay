import type { ChampionId } from '../ids';
import type { Champion, Comp } from '../types';
import type { ItemRecipeBook } from '../items/ItemRecipeBook';
import type { CompRepository } from '../repository/CompRepository';
import type { DataBundle } from './bundle';
import { createInMemoryRecipeBook } from '../items/inMemoryRecipeBook';
import { createInMemoryCompRepository } from '../repository/inMemoryCompRepository';
import { createDefaultRecipeBook, ITEM_LIST } from '../fixtures/items';
import { EXAMPLE_COMPS } from '../fixtures/comps';
import { EXAMPLE_CHAMPIONS, championName as exampleChampionName } from '../fixtures/champions';
import set18Bundle from '../../data/set18.json';

export type DataSource = 'set18' | 'example';

export interface LoadedData {
  source: DataSource;
  setName: string | null;
  patch: string | null;
  book: ItemRecipeBook;
  compRepository: CompRepository;
  comps: Comp[];
  champions: Champion[];
  championName: (id: ChampionId) => string;
}

/**
 * Ponto único de dados do app. Usa o pacote gerado (dados reais do set) quando ele
 * está preenchido; senão cai nas fixtures de exemplo — nunca quebra. A UI e os testes
 * consomem daqui, sem saber a origem.
 */
export function loadData(bundle: DataBundle = set18Bundle as DataBundle): LoadedData {
  const usable = bundle.generated && bundle.comps.length > 0 && bundle.champions.length > 0;

  if (!usable) {
    return {
      source: 'example',
      setName: null,
      patch: null,
      book: createDefaultRecipeBook(),
      compRepository: createInMemoryCompRepository(EXAMPLE_COMPS),
      comps: EXAMPLE_COMPS,
      champions: EXAMPLE_CHAMPIONS,
      championName: exampleChampionName,
    };
  }

  const book = createInMemoryRecipeBook(bundle.items.length > 0 ? bundle.items : ITEM_LIST);
  const nameById = new Map<ChampionId, string>(bundle.champions.map((c) => [c.id, c.name]));

  return {
    source: 'set18',
    setName: bundle.setName ?? null,
    patch: bundle.patch ?? null,
    book,
    compRepository: createInMemoryCompRepository(bundle.comps),
    comps: bundle.comps,
    champions: bundle.champions,
    championName: (id) => nameById.get(id) ?? id,
  };
}
