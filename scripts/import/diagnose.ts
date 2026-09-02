import { fetchJson } from './fetchJson';

// Diagnóstico: imprime a ESTRUTURA real das fontes (CommunityDragon + MetaTFT) pra
// eu ajustar os parsers. Roda na máquina do usuário (rede aberta):  npm run diagnose

const trunc = (s: string, n = 3500): string =>
  s.length > n ? `${s.slice(0, n)}\n… [+${s.length - n} chars truncados]` : s;
const j = (v: unknown, n = 3500): string => trunc(JSON.stringify(v, null, 2), n);

// procura, recursivamente, os arrays dentro do objeto (pra achar onde estão os clusters)
type Found = { path: string; len: number; sampleKeys: string };
function findArrays(v: any, path: string, out: Found[], depth = 0): void {
  if (depth > 6 || v == null) return;
  if (Array.isArray(v)) {
    const first = v[0];
    out.push({
      path: path || '(raiz)',
      len: v.length,
      sampleKeys: first && typeof first === 'object' ? Object.keys(first).join(', ') : JSON.stringify(first),
    });
    if (first && typeof first === 'object') findArrays(first, `${path}[0]`, out, depth + 1);
    return;
  }
  if (typeof v === 'object') for (const k of Object.keys(v)) findArrays(v[k], path ? `${path}.${k}` : k, out, depth + 1);
}

async function main(): Promise<void> {
  console.log('========== COMMUNITYDRAGON ==========');
  const cd: any = await fetchJson('https://raw.communitydragon.org/latest/cdragon/tft/en_us.json');
  const setData: any[] = Array.isArray(cd.setData) ? cd.setData : [];
  const numbers = setData.map((s) => s.number ?? 0);
  const maxN = Math.max(0, ...numbers, ...Object.keys(cd.sets ?? {}).map(Number).filter((n) => !Number.isNaN(n)));
  const canonical = setData.find((s) => s.mutator === `TFTSet${maxN}`) ?? setData.find((s) => s.number === maxN);
  console.log(`maxNumber=${maxN}`);
  console.log(`canonical: mutator=${JSON.stringify(canonical?.mutator)} name=${JSON.stringify(canonical?.name)} champions=${canonical?.champions?.length}`);
  console.log(`sets["${maxN}"]?.name =`, JSON.stringify(cd.sets?.[String(maxN)]?.name));
  const real = (canonical?.champions ?? []).filter((c: any) => c.apiName?.startsWith(`TFT${maxN}_`));
  console.log(`campeões com prefixo TFT${maxN}_ : ${real.length}`);
  console.log('exemplos:', real.slice(0, 6).map((c: any) => `${c.apiName}(c${c.cost})`).join(', '));
  console.log('sample champion real:', j({ apiName: real[0]?.apiName, name: real[0]?.name, cost: real[0]?.cost, traits: real[0]?.traits }, 800));

  console.log('\n========== METATFT comps_data ==========');
  const comps: any = await fetchJson('https://api-hc.metatft.com/tft-comps-api/comps_data?queue=1100');
  console.log('top-level keys:', Object.keys(comps));
  const arrs: Found[] = [];
  findArrays(comps, '', arrs, 0);
  console.log('arrays encontrados (path · len · chaves do 1º elemento):');
  for (const a of arrs.slice(0, 20)) console.log(`  ${a.path}  ·  len=${a.len}  ·  [${a.sampleKeys}]`);
  // dump do provável cluster: o array cujo 1º elemento tem 'units' ou mais chaves
  const best = arrs
    .filter((a) => typeof a.sampleKeys === 'string' && a.sampleKeys.includes(','))
    .sort((a, b) => (b.sampleKeys.includes('nits') ? 1 : 0) - (a.sampleKeys.includes('nits') ? 1 : 0))[0];
  console.log('\nprovável cluster em:', best?.path);
  const clusterArr = best ? best.path.split(/[.[\]]+/).filter(Boolean).reduce((o: any, k) => o?.[k], comps) : undefined;
  console.log('PRIMEIRO CLUSTER (completo):', j(Array.isArray(clusterArr) ? clusterArr[0] : clusterArr, 4000));

  console.log('\n========== METATFT comps_stats ==========');
  const stats: any = await fetchJson(
    'https://api-hc.metatft.com/tft-comps-api/comps_stats?queue=1100&patch=current&days=3&rank=DIAMOND,MASTER,GRANDMASTER,CHALLENGER&permit_filter_adjustment=true',
  );
  console.log('top-level keys:', Object.keys(stats));
  const statsArr = Array.isArray(stats.results) ? stats.results : undefined;
  console.log('stats.results é array?', Array.isArray(statsArr), 'len=', statsArr?.length);
  console.log('exemplo de stat (2º item):', j(statsArr?.[1], 600));
}

main().catch((e) => {
  console.error('diagnose falhou:', e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
