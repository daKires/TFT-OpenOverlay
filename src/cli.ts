import { suggestComps, loadData, COMPONENTS, type HeldState } from './core/index';

// CLI do projeto. Hoje serve só ao autoteste do cérebro (--selftest).
// Não é UI nem integração: exercita apenas o core determinístico e puro.

function selftest(): number {
  const data = loadData();

  const held: HeldState = {
    units: data.champions.slice(0, 2).map((c) => ({ championId: c.id, location: 'board', star: 1 })),
    components: [COMPONENTS.BF_SWORD, COMPONENTS.RECURVE_BOW],
  };

  const params = { book: data.book, championName: data.championName };
  const first = suggestComps(held, data.comps, params);
  const second = suggestComps(held, data.comps, params);

  const problems: string[] = [];
  if (first.length === 0) problems.push('nenhuma comp foi avaliada');
  if (first.filter((s) => s.isTopPick).length !== 1) problems.push('o top pick deve ser único');
  if (first.map((s) => s.comp.id).join('|') !== second.map((s) => s.comp.id).join('|')) {
    problems.push('o ranking não é determinístico entre execuções');
  }
  if (first.some((s) => !Number.isFinite(s.score))) problems.push('há score não numérico');

  const origin =
    data.source === 'set18'
      ? `dados reais do set (${data.setName ?? 'set'}${data.patch ? ` @ ${data.patch}` : ''})`
      : 'dados de exemplo (fixtures)';

  console.log('TFT-OpenOverlay — autoteste do cérebro (src/core)');
  console.log(`Fonte: ${origin}`);
  console.log(`Comps avaliadas: ${first.length}`);

  const top = first[0];
  if (top) {
    console.log(`Top 1: ${top.comp.name} — score ${top.score.toFixed(4)}`);
    console.log(`Motivo: ${top.explanation}`);
  }

  if (problems.length > 0) {
    console.error(`FALHOU: ${problems.join('; ')}`);
    return 1;
  }

  console.log('OK — cérebro determinístico e coerente.');
  return 0;
}

function main(argv: string[]): number {
  if (argv.includes('--selftest')) return selftest();
  console.log('Uso: node dist/index.js --selftest');
  return 0;
}

process.exit(main(process.argv.slice(2)));
