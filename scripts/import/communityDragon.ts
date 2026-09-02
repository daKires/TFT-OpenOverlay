import { COMPONENTS } from '../../src/core/domain/components';
import type { ComponentId, TraitId } from '../../src/core/ids';
import type { Champion, Item } from '../../src/core/types';

// Parser do CommunityDragon (raw.communitydragon.org/.../cdragon/tft/en_us.json).
// Extrai a grade de itens (par de 2 componentes base) e o roster/traits do SET ATUAL
// (o de maior número). Defensivo: ignora o que não bate no formato esperado.

const BASE_COMPONENTS = new Set<string>(Object.values(COMPONENTS));

export interface CDragonResult {
  setNumber: number;
  setName: string;
  items: Item[];
  champions: Champion[];
  traits: { id: TraitId; name: string }[];
}

interface RawItem {
  apiName?: string;
  name?: string;
  composition?: string[];
}
interface RawChampion {
  apiName?: string;
  name?: string;
  cost?: number;
  traits?: string[];
}
interface RawTrait {
  apiName?: string;
  name?: string;
}
interface RawSet {
  number?: number;
  name?: string;
  champions?: RawChampion[];
  traits?: RawTrait[];
}
interface RawCDragon {
  items?: RawItem[];
  setData?: RawSet[];
  sets?: Record<string, RawSet>;
}

export function parseCommunityDragon(json: unknown): CDragonResult {
  const data = (json ?? {}) as RawCDragon;

  // Itens completos = combinam exatamente 2 componentes BASE (exclui emblemas de
  // Spatula/Frying Pan, artefatos e radiantes, cuja composição não é 2 componentes base).
  const items: Item[] = [];
  for (const raw of data.items ?? []) {
    const c = raw.composition;
    if (!raw.apiName || !raw.name || !Array.isArray(c) || c.length !== 2) continue;
    if (!c.every((x) => BASE_COMPONENTS.has(x))) continue;
    items.push({ id: raw.apiName, name: raw.name, composition: [c[0], c[1]] as [ComponentId, ComponentId] });
  }

  // Set atual = maior "number" disponível (em setData[] ou sets{}).
  const sets: RawSet[] = data.setData ?? (data.sets ? Object.values(data.sets) : []);
  const current = sets.reduce<RawSet | undefined>((best, s) => {
    if (typeof s.number !== 'number') return best;
    return !best || (best.number ?? -1) < s.number ? s : best;
  }, undefined);

  const champions: Champion[] = [];
  for (const raw of current?.champions ?? []) {
    if (!raw.apiName || !raw.name || typeof raw.cost !== 'number') continue;
    if (raw.cost < 1 || raw.cost > 5) continue; // exclui bonecos/summons (custo 0/6+)
    champions.push({
      id: raw.apiName,
      name: raw.name,
      cost: raw.cost as 1 | 2 | 3 | 4 | 5,
      traits: Array.isArray(raw.traits) ? raw.traits : [],
    });
  }

  const traits = (current?.traits ?? [])
    .filter((t): t is Required<RawTrait> => Boolean(t.apiName && t.name))
    .map((t) => ({ id: t.apiName as TraitId, name: t.name }));

  return { setNumber: current?.number ?? 0, setName: current?.name ?? '', items, champions, traits };
}
