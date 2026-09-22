import { describe, it, expect } from 'vitest';
import { EXAMPLE_CHAMPIONS } from '../src/core/index';
import { mapGepToHeld, isOverwolf, subscribeOverwolfState } from '../src/integrations/overwolf';

// Payload de exemplo do GEP: valores como JSON-string (como chegam do Overwolf).
// board: 2 peças reconhecíveis (uma por id, outra por nome) + 1 desconhecida.
const info = {
  me: JSON.stringify({ gold: '42', level: '7', health: '88' }),
  match_info: JSON.stringify({ stage: '3-2' }),
  board: JSON.stringify({
    0: { championId: 'jinx', location: 'board', star: '2' },
    1: { name: 'Ashe', location: 'board' },
    2: { championId: 'nao-existe', name: 'Campeao Fantasma' },
  }),
};

describe('mapGepToHeld', () => {
  it('mapeia unidades reconhecidas (id e nome) e ignora a desconhecida', () => {
    const state = mapGepToHeld(info, EXAMPLE_CHAMPIONS);

    // A desconhecida é ignorada: só as 2 reconhecíveis entram.
    expect(state.units).toHaveLength(2);

    const jinx = state.units.find((u) => u.championId === 'jinx');
    expect(jinx).toBeDefined();
    expect(jinx!.location).toBe('board');
    expect(jinx!.star).toBe(2);

    const ashe = state.units.find((u) => u.championId === 'ashe');
    expect(ashe).toBeDefined();
    expect(ashe!.location).toBe('board');
    expect(ashe!.star).toBeUndefined();

    expect(state.units.some((u) => u.championId === ('nao-existe' as never))).toBe(false);
  });

  it('preenche a economia a partir de me e o estágio de match_info', () => {
    const { economy } = mapGepToHeld(info, EXAMPLE_CHAMPIONS);
    expect(economy.gold).toBe(42);
    expect(economy.level).toBe(7);
    expect(economy.hp).toBe(88);
    expect(economy.stage).toBe('3-2');
  });

  it('tolera seções já como objeto e peças no bench', () => {
    const state = mapGepToHeld(
      {
        me: { gold: 10, level: 5, health: 100 },
        match_info: { round: '2-1' },
        board: [{ championId: 'caitlyn' }],
        bench: { 0: { name: 'ezreal', location: 'bench' } },
      },
      EXAMPLE_CHAMPIONS,
    );

    expect(state.units).toHaveLength(2);
    expect(state.units.find((u) => u.championId === 'caitlyn')!.location).toBe('board');
    expect(state.units.find((u) => u.championId === 'ezreal')!.location).toBe('bench');
    expect(state.economy).toEqual({ gold: 10, level: 5, hp: 100, stage: '2-1' });
  });

  it('não quebra com payload vazio ou inválido', () => {
    expect(mapGepToHeld({}, EXAMPLE_CHAMPIONS)).toEqual({ units: [], economy: {} });
    expect(mapGepToHeld(null, EXAMPLE_CHAMPIONS)).toEqual({ units: [], economy: {} });
    expect(mapGepToHeld({ board: 'nao é json', me: 'também não' }, EXAMPLE_CHAMPIONS)).toEqual({
      units: [],
      economy: {},
    });
  });
});

describe('subscribeOverwolfState', () => {
  it('é no-op fora do Overwolf e devolve uma função de cancelamento', () => {
    expect(isOverwolf).toBe(false);
    const off = subscribeOverwolfState(EXAMPLE_CHAMPIONS, () => {});
    expect(typeof off).toBe('function');
    expect(() => off()).not.toThrow();
  });
});
