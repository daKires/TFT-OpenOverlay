import type { ComponentId, ItemId } from '../ids';
import type { Comp, HeldState, ItemProgress } from '../types';
import type { ItemRecipeBook } from '../items/ItemRecipeBook';
import type { ScoringOptions } from './weights';

export interface BuildabilityResult {
  /** Quanto os componentes montam os itens do carry (0..1). */
  score: number;
  progress: ItemProgress[];
}

interface Target {
  itemId: ItemId;
  weight: number;
  comp: [ComponentId, ComponentId];
}

type CountMap = Map<ComponentId, number>;

function toCountMap(components: ComponentId[]): CountMap {
  const m: CountMap = new Map();
  for (const c of components) m.set(c, (m.get(c) ?? 0) + 1);
  return m;
}

function demandOf(items: Target[]): CountMap {
  const m: CountMap = new Map();
  for (const it of items) for (const c of it.comp) m.set(c, (m.get(c) ?? 0) + 1);
  return m;
}

function feasible(demand: CountMap, supply: CountMap): boolean {
  for (const [c, n] of demand) if ((supply.get(c) ?? 0) < n) return false;
  return true;
}

function subtract(supply: CountMap, demand: CountMap): CountMap {
  const m: CountMap = new Map(supply);
  for (const [c, n] of demand) m.set(c, (m.get(c) ?? 0) - n);
  return m;
}

/**
 * Pergunta central: "meus componentes soltos montam os itens-chave do carry?"
 *
 * É um problema de alocação: cada componente só pode ser usado uma vez. Como o
 * espaço é minúsculo (poucos itens, poucos componentes), fazemos busca exaustiva
 * sobre QUAIS itens completar e maximizamos o valor:
 *   item completo   -> peso cheio
 *   falta 1 comp.   -> partialCredit * peso   (você está "quase lá")
 *   nada            -> 0
 * Itens já em completedItems contam como completos sem consumir componentes.
 */
export function computeItemBuildability(
  comp: Comp,
  held: HeldState,
  book: ItemRecipeBook,
  opts: ScoringOptions,
): BuildabilityResult {
  // 1. itens-alvo = itens (BiS) das unidades que os têm (normalmente os carries),
  //    cada um com peso por prioridade.
  const targets: Target[] = [];
  for (const unit of comp.units) {
    (unit.items ?? []).forEach((itemId, idx) => {
      const item = book.getItem(itemId);
      if (!item) return; // id inválido: ignorado no runtime (o teste de fixtures pega)
      const weight = opts.itemPriorityWeights[Math.min(idx, opts.itemPriorityWeights.length - 1)];
      targets.push({ itemId, weight, comp: item.composition });
    });
  }
  if (targets.length === 0) return { score: 0, progress: [] };

  const maxValue = targets.reduce((s, t) => s + t.weight, 0);

  // 2. itens já montados contam de graça
  const completedSet = new Set(held.completedItems ?? []);
  const already = targets.filter((t) => completedSet.has(t.itemId));
  const remaining = targets.filter((t) => !completedSet.has(t.itemId));

  // limitar o espaço de busca (bem folgado; comps normais têm <= 3 itens)
  const capped = [...remaining].sort((a, b) => b.weight - a.weight).slice(0, 6);
  const overflow = remaining.filter((t) => !capped.includes(t));

  const supply = toCountMap(held.components);

  let best = { value: -1, complete: new Set<ItemId>(), oneAway: new Set<ItemId>() };

  const n = capped.length;
  for (let mask = 0; mask < 1 << n; mask++) {
    const chosen: Target[] = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) chosen.push(capped[i]);

    if (!feasible(demandOf(chosen), supply)) continue;

    let leftover = subtract(supply, demandOf(chosen));
    let value = chosen.reduce((s, t) => s + t.weight, 0);
    const oneAway = new Set<ItemId>();

    // sobra vira crédito parcial pros itens não-completos, priorizando os de maior peso
    const rest = capped.filter((t) => !chosen.includes(t)).sort((a, b) => b.weight - a.weight);
    for (const t of rest) {
      const has = t.comp.find((c) => (leftover.get(c) ?? 0) > 0);
      if (has !== undefined) {
        leftover = subtract(leftover, toCountMap([has]));
        value += opts.partialCredit * t.weight;
        oneAway.add(t.itemId);
      }
    }

    if (value > best.value) {
      best = { value, complete: new Set(chosen.map((t) => t.itemId)), oneAway };
    }
  }

  const alreadyValue = already.reduce((s, t) => s + t.weight, 0);
  const totalValue = Math.max(0, best.value) + alreadyValue;
  const score = maxValue === 0 ? 0 : Math.min(1, totalValue / maxValue);

  // 3. relatório legível ("montável", "falta a peça X", "longe")
  const progress: ItemProgress[] = [];
  const push = (t: Target, status: ItemProgress['status']) => {
    let missing: ComponentId[] = [];
    if (status === 'one-away') {
      if (t.comp[0] === t.comp[1]) {
        missing = [t.comp[0]]; // dobrado: falta a 2ª cópia
      } else {
        const present = t.comp.find((c) => (supply.get(c) ?? 0) > 0);
        missing = [t.comp.find((c) => c !== present) ?? t.comp[1]];
      }
    } else if (status === 'far') {
      missing = [...new Set(t.comp)];
    }
    progress.push({ itemId: t.itemId, itemName: book.getItem(t.itemId)?.name ?? t.itemId, status, missing });
  };

  for (const t of already) push(t, 'complete');
  for (const t of capped) {
    if (best.complete.has(t.itemId)) push(t, 'complete');
    else if (best.oneAway.has(t.itemId)) push(t, 'one-away');
    else push(t, 'far');
  }
  for (const t of overflow) push(t, 'far');

  return { score, progress };
}
