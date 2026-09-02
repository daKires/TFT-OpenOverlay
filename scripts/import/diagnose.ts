import { fetchJson } from './fetchJson';

// Diagnóstico: imprime a ESTRUTURA real das fontes (CommunityDragon + MetaTFT) pra
// eu ajustar os parsers. Roda na máquina do usuário (rede aberta):  npm run diagnose

const trunc = (s: string, n = 2500): string =>
  s.length > n ? `${s.slice(0, n)}\n… [+${s.length - n} chars truncados]` : s;
const j = (v: unknown): string => trunc(JSON.stringify(v, null, 2));

function firstOf(container: any): { where: string; value: any } {
  if (Array.isArray(container)) return { where: 'array', value: container[0] };
  if (container?.cluster_details) {
    const d = container.cluster_details;
    return { where: 'cluster_details', value: Array.isArray(d) ? d[0] : Object.values(d)[0] };
  }
  if (container?.results?.data) {
    const d = container.results.data;
    return { where: 'results.data', value: Array.isArray(d) ? d[0] : Object.values(d)[0] };
  }
  if (container?.data) {
    const d = container.data;
    return { where: 'data', value: Array.isArray(d) ? d[0] : Object.values(d)[0] };
  }
  if (container && typeof container === 'object') {
    return { where: '(objeto no topo)', value: Object.values(container)[0] };
  }
  return { where: '(não achei)', value: undefined };
}

async function main(): Promise<void> {
  console.log('========== COMMUNITYDRAGON ==========');
  const cd: any = await fetchJson('https://raw.communitydragon.org/latest/cdragon/tft/en_us.json');
  console.log('top-level keys:', Object.keys(cd));
  if (Array.isArray(cd.setData)) {
    console.log('\nsetData (todas as entradas):');
    for (const s of cd.setData) {
      console.log(
        `  number=${s.number}  name=${JSON.stringify(s.name)}  mutator=${JSON.stringify(s.mutator)}  champions=${s.champions?.length ?? 0}  traits=${s.traits?.length ?? 0}`,
      );
    }
    const withChamps = cd.setData.filter((s: any) => s.champions?.length);
    console.log('\nsample champion (última entrada com champs):', j(withChamps[withChamps.length - 1]?.champions?.[0]));
  }
  if (cd.sets && typeof cd.sets === 'object') console.log('\nsets keys:', Object.keys(cd.sets));

  console.log('\n========== METATFT comps_data ==========');
  const comps: any = await fetchJson('https://api-hc.metatft.com/tft-comps-api/comps_data?queue=1100');
  console.log('tipo:', Array.isArray(comps) ? 'array' : typeof comps);
  if (comps && typeof comps === 'object' && !Array.isArray(comps)) console.log('top-level keys:', Object.keys(comps));
  const fc = firstOf(comps);
  console.log('clusters em:', fc.where);
  console.log('PRIMEIRO CLUSTER:', j(fc.value));

  console.log('\n========== METATFT comps_stats ==========');
  const stats: any = await fetchJson(
    'https://api-hc.metatft.com/tft-comps-api/comps_stats?queue=1100&patch=current&days=3&rank=DIAMOND,MASTER,GRANDMASTER,CHALLENGER&permit_filter_adjustment=true',
  );
  console.log('tipo:', Array.isArray(stats) ? 'array' : typeof stats);
  if (stats && typeof stats === 'object' && !Array.isArray(stats)) console.log('top-level keys:', Object.keys(stats));
  const fsentry = firstOf(stats);
  console.log('stats em:', fsentry.where);
  console.log('PRIMEIRO STAT:', j(fsentry.value));
}

main().catch((e) => {
  console.error('diagnose falhou:', e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
