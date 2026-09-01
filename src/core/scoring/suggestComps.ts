import type { ChampionId } from '../ids';
import type { Comp, CompSuggestion, HeldState } from '../types';
import type { ItemRecipeBook } from '../items/ItemRecipeBook';
import { resolveOptions, type ScoringOptions } from './weights';
import { computeUnitOverlap } from './unitOverlap';
import { computeItemBuildability } from './itemBuildability';
import { strengthFactor, computeStrength01 } from './metaStrength';
import { explain, type NameResolver } from './explain';

export interface SuggestParams {
  book: ItemRecipeBook;
  options?: Partial<ScoringOptions>;
  /** Resolve id de campeão -> nome legível (pra explicação). Padrão: o próprio id. */
  championName?: NameResolver;
}

/**
 * A função principal do cérebro. PURA: recebe o estado + as comps + a fonte de
 * receitas e devolve as comps ranqueadas com o porquê. Não faz I/O nem sabe de
 * onde veio o HeldState.
 */
export function suggestComps(held: HeldState, comps: Comp[], params: SuggestParams): CompSuggestion[] {
  const opts = resolveOptions(params.options);
  const nameOf: NameResolver = params.championName ?? ((id: ChampionId) => id);

  const suggestions = comps.map((comp) => scoreComp(comp, held, params.book, opts, nameOf));

  suggestions.sort((a, b) => b.score - a.score || a.comp.name.localeCompare(b.comp.name));
  suggestions.forEach((s, i) => {
    s.isTopPick = i === 0;
  });
  return suggestions;
}

function scoreComp(
  comp: Comp,
  held: HeldState,
  book: ItemRecipeBook,
  opts: ScoringOptions,
  nameOf: NameResolver,
): CompSuggestion {
  const overlap = computeUnitOverlap(comp, held, opts);
  const build = computeItemBuildability(comp, held, book, opts);
  const factor = strengthFactor(comp, opts);

  const fit = opts.fitWeights.units * overlap.score + opts.fitWeights.items * build.score;

  const score =
    opts.blend === 'linear'
      ? fit + opts.linearStrengthWeight * computeStrength01(comp, opts)
      : fit * factor;

  const suggestion: CompSuggestion = {
    comp,
    score,
    isTopPick: false,
    breakdown: {
      unitOverlap: overlap.score,
      itemBuildability: build.score,
      metaStrength: factor,
      fit,
    },
    why: {
      matchedUnits: overlap.matched,
      missingKeyUnits: overlap.missingKey,
      carryItems: build.progress,
    },
    explanation: '',
  };
  suggestion.explanation = explain(suggestion, nameOf);
  return suggestion;
}
