import { fetchJson } from './fetchJson';

// Diagnóstico: imprime a ESTRUTURA real das fontes pra eu ajustar os parsers.
// Roda na máquina do usuário (rede aberta):  npm run diagnose

const trunc = (s: string, n = 4000): string =>
  s.length > n ? `${s.slice(0, n)}\n… [+${s.length - n} chars truncados]` : s;
const j = (v: unknown, n = 4000): string => trunc(JSON.stringify(v, null, 2), n);

async function main(): Promise<void> {
  console.log('========== COMMUNITYDRAGON ==========');
  const cd: any = await fetchJson('https://raw.communitydragon.org/latest/cdragon/tft/en_us.json');
  const setData: any[] = Array.isArray(cd.setData) ? cd.setData : [];
  const maxN = Math.max(0, ...setData.map((s) => s.number ?? 0), ...Object.keys(cd.sets ?? {}).map(Number).filter((n) => !Number.isNaN(n)));
  const canonical = setData.find((s) => s.mutator === `TFTSet${maxN}`) ?? setData.find((s) => s.number === maxN);
  const champs: any[] = canonical?.champions ?? [];
  console.log(`maxNumber=${maxN} · canonical.mutator=${JSON.stringify(canonical?.mutator)} · champions=${champs.length}`);
  const withTraits = champs.filter((c) => Array.isArray(c.traits) && c.traits.length > 0 && c.cost >= 1 && c.cost <= 5);
  console.log(`campeões com custo 1-5 E traits: ${withTraits.length}`);
  console.log('primeiros 8 (custo 1-5 c/ traits):', j(withTraits.slice(0, 8).map((c) => ({ apiName: c.apiName, name: c.name, cost: c.cost, traits: c.traits })), 2500));

  console.log('\n========== METATFT comps_data — 1 cluster inteiro ==========');
  const comps: any = await fetchJson('https://api-hc.metatft.com/tft-comps-api/comps_data?queue=1100');
  const details = comps?.results?.data?.cluster_details;
  const firstKey = details && typeof details === 'object' ? Object.keys(details)[0] : undefined;
  const cl = firstKey ? details[firstKey] : undefined;
  console.log('cluster id:', firstKey, '| campos:', cl ? Object.keys(cl).join(', ') : '(nada)');
  console.log('name:', j(cl?.name, 600));
  console.log('stars:', j(cl?.stars, 600));
  console.log('builds:', j(cl?.builds, 2500));
  console.log('top_itemNames:', j(cl?.top_itemNames, 1500));

  console.log('\n========== METATFT comps_stats ==========');
  const stats: any = await fetchJson(
    'https://api-hc.metatft.com/tft-comps-api/comps_stats?queue=1100&patch=current&days=3&rank=DIAMOND,MASTER,GRANDMASTER,CHALLENGER&permit_filter_adjustment=true',
  );
  const statsArr = Array.isArray(stats?.results) ? stats.results : undefined;
  console.log('stats.results len:', statsArr?.length, '| 2º item:', j(statsArr?.[1], 400));
}

main().catch((e) => {
  console.error('diagnose falhou:', e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
