import type { Comp } from '../types';

/**
 * Fonte de comps do meta, PLUGÁVEL. O scorer só depende desta interface — não
 * sabe se as comps vêm de fixtures, do MetaTFT, do op.gg ou de um arquivo.
 */
export interface CompRepository {
  getComps(): Comp[] | Promise<Comp[]>;
}
