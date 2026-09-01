import type { Comp } from '../types';
import type { CompRepository } from './CompRepository';
import { EXAMPLE_COMPS } from '../fixtures/comps';

/** Repositório em memória. Por padrão usa as comps de exemplo. */
export function createInMemoryCompRepository(comps: Comp[] = EXAMPLE_COMPS): CompRepository {
  return { getComps: () => comps };
}
