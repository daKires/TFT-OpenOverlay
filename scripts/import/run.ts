import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchJson } from './fetchJson';
import { parseCommunityDragon } from './communityDragon';
import { buildIndex, parseMetaTFT } from './metaTft';
import type { DataBundle } from '../../src/core/data/bundle';

// Orquestrador do importador. Roda na máquina do usuário (onde a rede é aberta):
//   npm run import                       # busca CommunityDragon + MetaTFT do set atual
//   npm run import -- --patch=18.1        # fixa um patch em vez de "latest"
//   npm run import -- --rank=MASTER,GRANDMASTER,CHALLENGER
//   npm run import -- --from-samples --out=/tmp/x.json   # dry-run offline (sem rede)

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

interface Args {
  fromSamples: boolean;
  patch: string;
  rank: string;
  out: string;
}

function parseArgs(argv: string[]): Args {
  const get = (name: string, def: string): string => {
    const hit = argv.find((a) => a.startsWith(`--${name}=`));
    return hit ? hit.slice(name.length + 3) : def;
  };
  return {
    fromSamples: argv.includes('--from-samples'),
    patch: get('patch', 'latest'),
    rank: get('rank', 'DIAMOND,MASTER,GRANDMASTER,CHALLENGER'),
    out: get('out', 'src/data/set18.json'),
  };
}

async function loadSources(args: Args): Promise<{ cdragon: unknown; comps: unknown; stats: unknown }> {
  if (args.fromSamples) {
    const read = async (p: string) => JSON.parse(await readFile(resolve(ROOT, p), 'utf8')) as unknown;
    return {
      cdragon: await read('test/import/samples/cdragon.sample.json'),
      comps: await read('test/import/samples/metatft-comps.sample.json'),
      stats: await read('test/import/samples/metatft-stats.sample.json'),
    };
  }

  const cdragonUrl = `https://raw.communitydragon.org/${args.patch}/cdragon/tft/en_us.json`;
  const compsUrl = 'https://api-hc.metatft.com/tft-comps-api/comps_data?queue=1100';
  const statsUrl = `https://api-hc.metatft.com/tft-comps-api/comps_stats?queue=1100&patch=current&days=3&rank=${args.rank}&permit_filter_adjustment=true`;

  console.log(`↓ CommunityDragon: ${cdragonUrl}`);
  const cdragon = await fetchJson(cdragonUrl);

  let comps: unknown = {};
  let stats: unknown = {};
  try {
    console.log('↓ MetaTFT comps + stats');
    comps = await fetchJson(compsUrl);
    stats = await fetchJson(statsUrl);
  } catch (err) {
    console.warn(`⚠ MetaTFT indisponível (${err instanceof Error ? err.message : err}); comps ficarão de exemplo.`);
  }
  return { cdragon, comps, stats };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const src = await loadSources(args);

  const cdragon = parseCommunityDragon(src.cdragon);
  const index = buildIndex(cdragon);

  let comps: DataBundle['comps'] = [];
  let unmatched = { units: [] as string[], items: [] as string[] };
  try {
    const meta = parseMetaTFT(src.comps, src.stats, index);
    comps = meta.comps;
    unmatched = meta.unmatched;
  } catch (err) {
    console.warn(`⚠ Falha ao processar comps do MetaTFT: ${err instanceof Error ? err.message : err}`);
  }

  const bundle: DataBundle = {
    generated: true,
    setName: cdragon.setName || null,
    patch: args.fromSamples ? 'sample' : args.patch,
    generatedAt: new Date().toISOString(),
    items: cdragon.items,
    champions: cdragon.champions,
    traits: cdragon.traits,
    comps,
  };

  const outPath = resolve(ROOT, args.out);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(bundle, null, 2)}\n`, 'utf8');

  console.log('\n── Importação concluída ──');
  console.log(`Set: ${cdragon.setName || '?'} (nº ${cdragon.setNumber})`);
  console.log(`Itens (receitas): ${cdragon.items.length}`);
  console.log(`Campeões: ${cdragon.champions.length} · Traits: ${cdragon.traits.length}`);
  console.log(`Comps: ${comps.length}`);
  if (comps.length > 0) {
    const top = comps[0];
    const carry = top.units.find((u) => u.role === 'carry');
    console.log(`  ex.: "${top.name}" · avg ${top.avgPlacement ?? '?'} · carry ${carry?.championId ?? '?'} (${carry?.items?.length ?? 0} itens)`);
  }
  if (unmatched.units.length || unmatched.items.length) {
    console.log(`Não casaram → unidades: ${unmatched.units.length}, itens: ${unmatched.items.length}`);
    if (unmatched.units.length) console.log(`  unidades: ${unmatched.units.slice(0, 20).join(', ')}`);
    if (unmatched.items.length) console.log(`  itens: ${unmatched.items.slice(0, 20).join(', ')}`);
  }
  if (comps.length === 0) {
    console.log('⚠ Nenhuma comp gerada → o app mantém as comps de exemplo (veja o README pra ajustar o mapeamento).');
  }
  console.log(`\nArquivo gravado: ${args.out}`);
}

main().catch((err) => {
  console.error(`\n✖ Importação falhou: ${err instanceof Error ? err.message : err}`);
  process.exitCode = 1;
});
