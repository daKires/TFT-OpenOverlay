import type { ChampionId, ItemId } from '../../src/core/ids';
import type { Comp, CompUnit } from '../../src/core/types';
import type { CDragonResult } from './communityDragon';

// Parser do MetaTFT (comps do meta) → Comp[]. É best-effort: o formato exato dos ids
// do MetaTFT só se confirma na 1ª execução real, então reconciliamos por apiName E por
// nome normalizado, e coletamos o que não casar (sem quebrar).

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const slug = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'comp';

export interface ImportIndex {
  resolveChampion(ref: string): ChampionId | undefined;
  resolveItem(ref: string): ItemId | undefined;
}

/** Constrói os índices de reconciliação a partir do resultado do CommunityDragon. */
export function buildIndex(cdragon: CDragonResult): ImportIndex {
  const champById = new Set<string>(cdragon.champions.map((c) => c.id));
  const champByName = new Map<string, ChampionId>();
  for (const c of cdragon.champions) {
    champByName.set(norm(c.id), c.id);
    champByName.set(norm(c.name), c.id);
  }
  const itemById = new Set<string>(cdragon.items.map((i) => i.id));
  const itemByName = new Map<string, ItemId>();
  for (const i of cdragon.items) {
    itemByName.set(norm(i.id), i.id);
    itemByName.set(norm(i.name), i.id);
  }
  return {
    resolveChampion: (ref) => (champById.has(ref) ? ref : champByName.get(norm(ref))),
    resolveItem: (ref) => (itemById.has(ref) ? ref : itemByName.get(norm(ref))),
  };
}

export interface MetaTftResult {
  comps: Comp[];
  unmatched: { units: string[]; items: string[] };
}

interface RawUnit {
  apiName?: string;
  id?: string;
  character_id?: string;
  name?: string;
  items?: string[];
}
interface RawCluster {
  Cluster?: number | string;
  cluster_id?: number | string;
  id?: number | string;
  name_string?: string;
  name?: string;
  units?: RawUnit[];
}
interface RawStat {
  places?: number[];
  count?: number;
}

function toClusters(compsData: unknown): RawCluster[] {
  const d = compsData as Record<string, unknown> | undefined;
  const raw =
    (d?.cluster_details as unknown) ??
    ((d?.results as Record<string, unknown> | undefined)?.data as unknown) ??
    (d?.data as unknown) ??
    d;
  if (Array.isArray(raw)) return raw as RawCluster[];
  if (raw && typeof raw === 'object') return Object.values(raw as Record<string, RawCluster>);
  return [];
}

function statsById(compsStats: unknown): Map<string, RawStat> {
  const map = new Map<string, RawStat>();
  const d = compsStats as Record<string, unknown> | undefined;
  const raw = (d?.results as Record<string, unknown> | undefined)?.data ?? d?.data ?? d;
  if (Array.isArray(raw)) {
    for (const s of raw as (RawStat & { Cluster?: number | string; id?: number | string })[]) {
      const key = s.Cluster ?? s.id;
      if (key != null) map.set(String(key), s);
    }
  } else if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw as Record<string, RawStat>)) map.set(k, v);
  }
  return map;
}

function placementStats(stat: RawStat | undefined): { avgPlacement?: number; top4Rate?: number; count?: number } {
  if (!stat?.places || stat.places.length < 8) return { count: stat?.count };
  const p = stat.places.slice(0, 8);
  const total = stat.count ?? p.reduce((a, b) => a + b, 0);
  if (total <= 0) return { count: stat.count };
  const weighted = p.reduce((sum, n, i) => sum + (i + 1) * n, 0);
  const top4 = p[0] + p[1] + p[2] + p[3];
  return { avgPlacement: weighted / total, top4Rate: top4 / total, count: stat.count ?? total };
}

export function parseMetaTFT(compsData: unknown, compsStats: unknown, index: ImportIndex): MetaTftResult {
  const clusters = toClusters(compsData);
  const stats = statsById(compsStats);
  const unmatchedUnits = new Set<string>();
  const unmatchedItems = new Set<string>();
  const comps: Comp[] = [];

  clusters.forEach((cluster, idx) => {
    const clusterId = String(cluster.Cluster ?? cluster.cluster_id ?? cluster.id ?? idx);
    const displayName = cluster.name_string ?? cluster.name ?? `Comp ${clusterId}`;

    const units: CompUnit[] = [];
    for (const ru of cluster.units ?? []) {
      const ref = ru.apiName ?? ru.id ?? ru.character_id ?? ru.name;
      const champId = ref ? index.resolveChampion(ref) : undefined;
      if (!champId) {
        if (ref) unmatchedUnits.add(ref);
        continue;
      }
      const itemIds: ItemId[] = [];
      for (const it of Array.isArray(ru.items) ? ru.items : []) {
        const id = index.resolveItem(it);
        if (id) itemIds.push(id);
        else unmatchedItems.add(it);
      }
      const unit: CompUnit = { championId: champId, role: itemIds.length > 0 ? 'carry' : 'core' };
      if (itemIds.length > 0) unit.items = itemIds;
      units.push(unit);
    }

    if (units.length === 0) return; // comp sem nenhuma unidade reconhecida: descarta

    const s = placementStats(stats.get(clusterId));
    comps.push({
      id: slug(displayName),
      name: displayName,
      units,
      ...(s.avgPlacement != null ? { avgPlacement: Number(s.avgPlacement.toFixed(3)) } : {}),
      ...(s.top4Rate != null ? { top4Rate: Number(s.top4Rate.toFixed(3)) } : {}),
      ...(s.count != null ? { sampleSize: s.count } : {}),
    });
  });

  return { comps, unmatched: { units: [...unmatchedUnits], items: [...unmatchedItems] } };
}
