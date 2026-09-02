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
  mutator?: string;
  champions?: RawChampion[];
  traits?: RawTrait[];
}
interface RawCDragon {
  items?: RawItem[];
  setData?: RawSet[];
  sets?: Record<string, RawSet>;
}

const isJunkName = (n?: string): boolean => !n || /^set\s*\d+$/i.test(n.trim());

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

  // Set atual = maior "number" (setData tem MUITAS entradas: variantes _PVEMODE,
  // _TURBO, _PAIRS, eventos… todas com o mesmo number). Escolhemos a canônica
  // (mutator exatamente "TFTSet<n>"); senão a de mais campeões.
  const setData = data.setData ?? [];
  const numbersInSets = Object.keys(data.sets ?? {}).map(Number).filter((n) => !Number.isNaN(n));
  const setNumber = Math.max(
    0,
    ...setData.map((s) => s.number ?? 0),
    ...numbersInSets,
  );

  const sameNumber = setData.filter((s) => s.number === setNumber);
  const canonical: RawSet | undefined =
    sameNumber.find((s) => s.mutator === `TFTSet${setNumber}`) ??
    sameNumber.slice().sort((a, b) => (b.champions?.length ?? 0) - (a.champions?.length ?? 0))[0] ??
    data.sets?.[String(setNumber)];

  // Campeões REAIS do set têm apiName com prefixo "TFT<n>_" (ex. TFT18_Ahri).
  // Isso exclui summons/monstros/tokens (ex. TFT_BlueGolem) que vêm no mesmo set.
  const prefix = `TFT${setNumber}_`;
  const champions: Champion[] = [];
  for (const raw of canonical?.champions ?? []) {
    if (!raw.apiName || !raw.name || typeof raw.cost !== 'number') continue;
    if (raw.cost < 1 || raw.cost > 5) continue;
    if (!raw.apiName.startsWith(prefix)) continue;
    champions.push({
      id: raw.apiName,
      name: raw.name,
      cost: raw.cost as 1 | 2 | 3 | 4 | 5,
      traits: Array.isArray(raw.traits) ? raw.traits : [],
    });
  }

  const traits = (canonical?.traits ?? [])
    .filter((t): t is Required<RawTrait> => Boolean(t.apiName && t.name))
    .map((t) => ({ id: t.apiName as TraitId, name: t.name }));

  // O campo `name` da entrada às vezes é lixo ("Set10"); prefere um nome de verdade.
  const setName =
    [data.sets?.[String(setNumber)]?.name, canonical?.name].find((n) => !isJunkName(n)) ?? `Set ${setNumber}`;

  return { setNumber, setName, items, champions, traits };
}
