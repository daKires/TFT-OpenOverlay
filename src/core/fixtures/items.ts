import type { ItemId } from '../ids';
import type { Item } from '../types';
import { COMPONENTS as C } from '../domain/components';
import { createInMemoryRecipeBook } from '../items/inMemoryRecipeBook';
import type { ItemRecipeBook } from '../items/ItemRecipeBook';

// -----------------------------------------------------------------------------
// DADOS DE EXEMPLO (receitas). Os 8 "dobrados" (componente + ele mesmo) são
// estáveis entre sets. Os cruzamentos usam nomes CLÁSSICOS conhecidos — servem
// pra exercitar o scorer, NÃO estão amarrados a um patch específico. O conjunto
// real virá do CommunityDragon depois, atrás da mesma interface ItemRecipeBook.
// -----------------------------------------------------------------------------

export const ITEMS = {
  // dobrados (estáveis)
  DEATHBLADE: 'TFT_Item_Deathblade',
  RAPID_FIRECANNON: 'TFT_Item_RapidFirecannon',
  RABADONS: 'TFT_Item_RabadonsDeathcap',
  BLUE_BUFF: 'TFT_Item_BlueBuff',
  BRAMBLE_VEST: 'TFT_Item_BrambleVest',
  DRAGONS_CLAW: 'TFT_Item_DragonsClaw',
  WARMOGS: 'TFT_Item_WarmogsArmor',
  THIEFS_GLOVES: 'TFT_Item_ThiefsGloves',
  // cruzamentos (clássicos)
  GIANT_SLAYER: 'TFT_Item_GiantSlayer',
  HEXTECH_GUNBLADE: 'TFT_Item_HextechGunblade',
  SPEAR_OF_SHOJIN: 'TFT_Item_SpearOfShojin',
  BLOODTHIRSTER: 'TFT_Item_Bloodthirster',
  STERAKS: 'TFT_Item_SteraksGage',
  INFINITY_EDGE: 'TFT_Item_InfinityEdge',
  GUINSOOS: 'TFT_Item_GuinsoosRageblade',
  STATIKK: 'TFT_Item_StatikkShiv',
  TITANS_RESOLVE: 'TFT_Item_TitansResolve',
  RUNAANS: 'TFT_Item_RunaansHurricane',
  LAST_WHISPER: 'TFT_Item_LastWhisper',
  ARCHANGELS: 'TFT_Item_ArchangelsStaff',
  IONIC_SPARK: 'TFT_Item_IonicSpark',
  MORELLONOMICON: 'TFT_Item_Morellonomicon',
  JEWELED_GAUNTLET: 'TFT_Item_JeweledGauntlet',
  HAND_OF_JUSTICE: 'TFT_Item_HandOfJustice',
  REDEMPTION: 'TFT_Item_Redemption',
  GARGOYLE: 'TFT_Item_GargoyleStoneplate',
  QUICKSILVER: 'TFT_Item_Quicksilver',
} as const satisfies Record<string, ItemId>;

export const ITEM_LIST: Item[] = [
  // dobrados
  { id: ITEMS.DEATHBLADE, name: 'Deathblade', composition: [C.BF_SWORD, C.BF_SWORD] },
  { id: ITEMS.RAPID_FIRECANNON, name: 'Rapid Firecannon', composition: [C.RECURVE_BOW, C.RECURVE_BOW] },
  { id: ITEMS.RABADONS, name: "Rabadon's Deathcap", composition: [C.NEEDLESSLY_LARGE_ROD, C.NEEDLESSLY_LARGE_ROD] },
  { id: ITEMS.BLUE_BUFF, name: 'Blue Buff', composition: [C.TEAR, C.TEAR] },
  { id: ITEMS.BRAMBLE_VEST, name: 'Bramble Vest', composition: [C.CHAIN_VEST, C.CHAIN_VEST] },
  { id: ITEMS.DRAGONS_CLAW, name: "Dragon's Claw", composition: [C.NEGATRON_CLOAK, C.NEGATRON_CLOAK] },
  { id: ITEMS.WARMOGS, name: "Warmog's Armor", composition: [C.GIANTS_BELT, C.GIANTS_BELT] },
  { id: ITEMS.THIEFS_GLOVES, name: "Thief's Gloves", composition: [C.SPARRING_GLOVES, C.SPARRING_GLOVES] },
  // cruzamentos
  { id: ITEMS.GIANT_SLAYER, name: 'Giant Slayer', composition: [C.BF_SWORD, C.RECURVE_BOW] },
  { id: ITEMS.HEXTECH_GUNBLADE, name: 'Hextech Gunblade', composition: [C.BF_SWORD, C.NEEDLESSLY_LARGE_ROD] },
  { id: ITEMS.SPEAR_OF_SHOJIN, name: 'Spear of Shojin', composition: [C.BF_SWORD, C.TEAR] },
  { id: ITEMS.BLOODTHIRSTER, name: 'Bloodthirster', composition: [C.BF_SWORD, C.NEGATRON_CLOAK] },
  { id: ITEMS.STERAKS, name: "Sterak's Gage", composition: [C.BF_SWORD, C.GIANTS_BELT] },
  { id: ITEMS.INFINITY_EDGE, name: 'Infinity Edge', composition: [C.BF_SWORD, C.SPARRING_GLOVES] },
  { id: ITEMS.GUINSOOS, name: "Guinsoo's Rageblade", composition: [C.RECURVE_BOW, C.NEEDLESSLY_LARGE_ROD] },
  { id: ITEMS.STATIKK, name: 'Statikk Shiv', composition: [C.RECURVE_BOW, C.TEAR] },
  { id: ITEMS.TITANS_RESOLVE, name: "Titan's Resolve", composition: [C.RECURVE_BOW, C.CHAIN_VEST] },
  { id: ITEMS.RUNAANS, name: "Runaan's Hurricane", composition: [C.RECURVE_BOW, C.NEGATRON_CLOAK] },
  { id: ITEMS.LAST_WHISPER, name: 'Last Whisper', composition: [C.RECURVE_BOW, C.SPARRING_GLOVES] },
  { id: ITEMS.ARCHANGELS, name: "Archangel's Staff", composition: [C.NEEDLESSLY_LARGE_ROD, C.TEAR] },
  { id: ITEMS.IONIC_SPARK, name: 'Ionic Spark', composition: [C.NEEDLESSLY_LARGE_ROD, C.NEGATRON_CLOAK] },
  { id: ITEMS.MORELLONOMICON, name: 'Morellonomicon', composition: [C.NEEDLESSLY_LARGE_ROD, C.GIANTS_BELT] },
  { id: ITEMS.JEWELED_GAUNTLET, name: 'Jeweled Gauntlet', composition: [C.NEEDLESSLY_LARGE_ROD, C.SPARRING_GLOVES] },
  { id: ITEMS.HAND_OF_JUSTICE, name: 'Hand of Justice', composition: [C.TEAR, C.SPARRING_GLOVES] },
  { id: ITEMS.REDEMPTION, name: 'Redemption', composition: [C.TEAR, C.GIANTS_BELT] },
  { id: ITEMS.GARGOYLE, name: 'Gargoyle Stoneplate', composition: [C.CHAIN_VEST, C.NEGATRON_CLOAK] },
  { id: ITEMS.QUICKSILVER, name: 'Quicksilver', composition: [C.NEGATRON_CLOAK, C.SPARRING_GLOVES] },
];

/** Recipe book padrão (dados de exemplo). Troque por um loader real depois. */
export function createDefaultRecipeBook(): ItemRecipeBook {
  return createInMemoryRecipeBook(ITEM_LIST);
}
