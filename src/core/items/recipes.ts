import type { ComponentId } from '../ids';

// Helpers de receita. Uma receita é um PAR NÃO-ORDENADO de componentes; então
// canonicalizamos o par (ordenando) pra que (A,B) e (B,A) virem a mesma chave, e
// itens dobrados (A,A) funcionem de graça.

export function canonicalizePair(a: ComponentId, b: ComponentId): [ComponentId, ComponentId] {
  return a <= b ? [a, b] : [b, a];
}

export function pairKey(a: ComponentId, b: ComponentId): string {
  const [x, y] = canonicalizePair(a, b);
  return `${x}++${y}`;
}
