import type { ChampionId, ItemId } from '../../src/core/ids';
import type { Comp, CompUnit } from '../../src/core/types';
import type { CDragonResult } from './communityDragon';

// Parser do MetaTFT (comps do meta) → Comp[]. Formato real:
//   comps_data.results.data.cluster_details = { "422000": cluster, ... }
//   cluster.stars      = ids das unidades ("DA_18_Rengar", "DA_Vi18", …)
//   cluster.builds[]   = { unit, buildName: [itens do carry], … }  (itens em buildName)
//   cluster.name       = [{name:"DA_18_Fae", type:"trait"}, {name:"DA_18_Rengar", type:"unit"}]
//   comps_stats.results = [{ cluster:"422000", places:[c1..c8, total], count }]
//
// Reconciliação com o CommunityDragon: id exato primeiro; senão por "chave" (nome
// sem prefixo DA_, sem número de set, sem sufixo _AP/_AD).

const MAX_CARRIES = 2; // top-N builds (por popularidade) viram carry; o resto = core

function keyOf(ref: string): string {
  return ref
    .replace(/^DA[_-]?/i, '')
    .replace(/_(AP|AD|Support|Radiant)$/i, '')
    .replace(/\d+/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const pretty = (id: string): string =>
  id.replace(/^DA_/i, '').replace(/^\d+_/, '').replace(/_(AP|AD)$/i, '').replace(/_/g, ' ').trim();

const slug = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'comp';

export interface ImportIndex {
  resolveChampion(ref: string): ChampionId | undefined;
  resolveItem(ref: string): ItemId | undefined;
}

/** Índices de reconciliação a partir do resultado do CommunityDragon. */
export function buildIndex(cdragon: CDragonResult): ImportIndex {
  const champById = new Set<string>(cdragon.champions.map((c) => c.id));
  const champByKey = new Map<string, ChampionId>();
  for (const c of cdragon.champions) {
    champByKey.set(keyOf(c.id), c.id);
    champByKey.set(keyOf(c.name), c.id);
  }
  const itemById = new Set<string>(cdragon.items.map((i) => i.id));
  const itemByKey = new Map<string, ItemId>();
  for (const i of cdragon.items) {
    itemByKey.set(keyOf(i.id), i.id);
    itemByKey.set(keyOf(i.name), i.id);
  }
  return {
    resolveChampion: (ref) => (champById.has(ref) ? ref : champByKey.get(keyOf(ref))),
    resolveItem: (ref) => (itemById.has(ref) ? ref : itemByKey.get(keyOf(ref))),
  };
}

export interface MetaTftResult {
  comps: Comp[];
  unmatched: { units: string[]; items: string[] };
}

function statsIndex(compsStats: any): Map<string, { places?: number[]; count?: number }> {
  const map = new Map<string, { places?: number[]; count?: number }>();
  const results = compsStats?.results ?? compsStats?.data ?? compsStats;
  if (Array.isArray(results)) {
    for (const s of results) if (s?.cluster) map.set(String(s.cluster), s);
  }
  return map;
}

function placement(stat?: { places?: number[]; count?: number }): {
  avgPlacement?: number;
  top4Rate?: number;
  count?: number;
} {
  if (!stat?.places || stat.places.length < 8) return { count: stat?.count };
  const p = stat.places.slice(0, 8);
  const total = stat.count ?? p.reduce((a, b) => a + b, 0);
  if (total <= 0) return { count: stat.count };
  const avg = p.reduce((sum, n, i) => sum + (i + 1) * n, 0) / total;
  const top4 = (p[0] + p[1] + p[2] + p[3]) / total;
  return { avgPlacement: avg, top4Rate: top4, count: stat.count ?? total };
}

function displayName(cluster: any): string {
  const ns = cluster?.name_string;
  if (typeof ns === 'string' && ns && !/^DA[_-]/i.test(ns)) return ns;
  const arr: any[] = Array.isArray(cluster?.name) ? cluster.name : [];
  const trait = arr.find((x) => x?.type === 'trait')?.name;
  const unit = arr.find((x) => x?.type === 'unit')?.name;
  const parts = [trait, unit].filter(Boolean).map((s) => pretty(String(s)));
  return parts.join(' ') || `Comp ${cluster?.Cluster ?? ''}`.trim();
}

const round = (x: number): number => Number(x.toFixed(3));

export function parseMetaTFT(compsData: any, compsStats: any, index: ImportIndex): MetaTftResult {
  const details = compsData?.results?.data?.cluster_details ?? compsData?.cluster_details;
  const clusters: [string, any][] = details && typeof details === 'object' ? Object.entries(details) : [];
  const stats = statsIndex(compsStats);
  const unmatchedUnits = new Set<string>();
  const unmatchedItems = new Set<string>();
  const comps: Comp[] = [];

  for (const [key, cluster] of clusters) {
    const clusterId = String(cluster?.Cluster ?? key);
    const builds: any[] = Array.isArray(cluster?.builds) ? cluster.builds : [];
    const stars: string[] = Array.isArray(cluster?.stars) ? cluster.stars : [];

    const seen = new Set<ChampionId>();
    const units: CompUnit[] = [];

    // carries = top builds (por popularidade), com os itens do buildName
    for (const b of builds.slice(0, MAX_CARRIES)) {
      const ref: string | undefined = b?.unit;
      const champId = ref ? index.resolveChampion(ref) : undefined;
      if (!champId) {
        if (ref) unmatchedUnits.add(ref);
        continue;
      }
      if (seen.has(champId)) continue;
      const itemIds: ItemId[] = [];
      for (const it of Array.isArray(b.buildName) ? b.buildName : []) {
        const id = index.resolveItem(it);
        if (id) itemIds.push(id);
        else unmatchedItems.add(it);
      }
      const unit: CompUnit = { championId: champId, role: 'carry' };
      if (itemIds.length > 0) unit.items = itemIds;
      units.push(unit);
      seen.add(champId);
    }

    // demais unidades (stars) = core
    for (const ref of stars) {
      const champId = index.resolveChampion(ref);
      if (!champId) {
        unmatchedUnits.add(ref);
        continue;
      }
      if (seen.has(champId)) continue;
      units.push({ championId: champId, role: 'core' });
      seen.add(champId);
    }

    if (units.length === 0) continue;

    const name = displayName(cluster);
    const s = placement(stats.get(clusterId));
    comps.push({
      id: slug(name),
      name,
      units,
      ...(s.avgPlacement != null ? { avgPlacement: round(s.avgPlacement) } : {}),
      ...(s.top4Rate != null ? { top4Rate: round(s.top4Rate) } : {}),
      ...(s.count != null ? { sampleSize: s.count } : {}),
    });
  }

  return { comps, unmatched: { units: [...unmatchedUnits], items: [...unmatchedItems] } };
}
