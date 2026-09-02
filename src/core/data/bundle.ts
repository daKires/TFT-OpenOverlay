import type { TraitId } from '../ids';
import type { Champion, Comp, Item } from '../types';

/**
 * Pacote de dados que alimenta o cérebro. É só DADOS (sem lógica) — pode vir das
 * fixtures de exemplo ou ser gerado pelo importador (scripts/import) a partir das
 * fontes reais do set atual. `generated=false` = ainda é placeholder/exemplo.
 */
export interface DataBundle {
  generated: boolean;
  setName?: string | null;
  patch?: string | null;
  generatedAt?: string | null;
  items: Item[];
  champions: Champion[];
  comps: Comp[];
  traits?: { id: TraitId; name: string }[];
}
