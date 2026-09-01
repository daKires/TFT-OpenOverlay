import type { ChampionId } from '../ids';
import type { CompSuggestion } from '../types';
import { componentName } from '../domain/components';

export type NameResolver = (id: ChampionId) => string;

/** Monta a frase legível (PT-BR) a partir do "porquê" estruturado. */
export function explain(s: CompSuggestion, championName: NameResolver): string {
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const parts: string[] = [];

  parts.push(
    `Encaixe ${pct(s.breakdown.fit)} (unidades ${pct(s.breakdown.unitOverlap)}, itens ${pct(s.breakdown.itemBuildability)}).`,
  );

  if (s.why.matchedUnits.length) {
    parts.push(`Você já tem: ${s.why.matchedUnits.map(championName).join(', ')}.`);
  }
  if (s.why.missingKeyUnits.length) {
    parts.push(`Faltam peças-chave: ${s.why.missingKeyUnits.map(championName).join(', ')}.`);
  }

  const complete = s.why.carryItems.filter((i) => i.status === 'complete').map((i) => i.itemName);
  if (complete.length) parts.push(`Itens do carry montáveis agora: ${complete.join(', ')}.`);

  for (const i of s.why.carryItems.filter((i) => i.status === 'one-away')) {
    parts.push(`Falta 1 componente pra ${i.itemName}: ${i.missing.map(componentName).join(', ')}.`);
  }

  return parts.join(' ');
}
