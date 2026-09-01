import type { Comp } from '../types';
import { ITEMS as I } from './items';

// DADOS DE EXEMPLO. 5 comps FICTÍCIAS (nome no padrão "<trait core> + <carry>").
// avgPlacement/tier são inventados só pra exercitar o desempate por força.
// O carry leva os itens ideais (BiS) em ordem de prioridade.

export const EXAMPLE_COMPS: Comp[] = [
  {
    id: 'sorcerers-ahri',
    name: 'Sorcerers + Ahri',
    avgPlacement: 3.9,
    tier: 'S',
    top4Rate: 0.61,
    units: [
      { championId: 'ahri', role: 'carry', items: [I.HEXTECH_GUNBLADE, I.ARCHANGELS, I.JEWELED_GAUNTLET] },
      { championId: 'lux', role: 'core' },
      { championId: 'morgana', role: 'core' },
      { championId: 'leona', role: 'core' },
      { championId: 'lulu', role: 'flex' },
      { championId: 'soraka', role: 'flex' },
      { championId: 'garen', role: 'flex' },
      { championId: 'braum', role: 'flex' },
    ],
  },
  {
    id: 'snipers-jinx',
    name: 'Snipers + Jinx',
    avgPlacement: 4.1,
    tier: 'A',
    top4Rate: 0.57,
    units: [
      { championId: 'jinx', role: 'carry', items: [I.GIANT_SLAYER, I.LAST_WHISPER, I.INFINITY_EDGE] },
      { championId: 'caitlyn', role: 'core' },
      { championId: 'ashe', role: 'core' },
      { championId: 'ezreal', role: 'core' },
      { championId: 'leona', role: 'core' },
      { championId: 'lux', role: 'flex' },
      { championId: 'braum', role: 'flex' },
      { championId: 'soraka', role: 'flex' },
    ],
  },
  {
    id: 'bruisers-sett',
    name: 'Bruisers + Sett',
    avgPlacement: 4.2,
    tier: 'A',
    top4Rate: 0.55,
    units: [
      { championId: 'sett', role: 'carry', items: [I.STERAKS, I.TITANS_RESOLVE, I.GARGOYLE] },
      { championId: 'garen', role: 'core' },
      { championId: 'darius', role: 'core' },
      { championId: 'vi', role: 'core' },
      { championId: 'leona', role: 'flex' },
      { championId: 'braum', role: 'flex' },
      { championId: 'soraka', role: 'flex' },
    ],
  },
  {
    id: 'assassins-katarina',
    name: 'Assassins + Katarina',
    avgPlacement: 4.3,
    tier: 'B',
    top4Rate: 0.52,
    units: [
      { championId: 'katarina', role: 'carry', items: [I.JEWELED_GAUNTLET, I.HEXTECH_GUNBLADE, I.HAND_OF_JUSTICE] },
      { championId: 'akali', role: 'core' },
      { championId: 'yasuo', role: 'core' },
      { championId: 'vi', role: 'core' },
      { championId: 'darius', role: 'flex' },
      { championId: 'leona', role: 'flex' },
      { championId: 'braum', role: 'flex' },
    ],
  },
  {
    id: 'enforcers-caitlyn',
    name: 'Enforcers + Caitlyn',
    avgPlacement: 4.4,
    tier: 'B',
    top4Rate: 0.5,
    units: [
      { championId: 'caitlyn', role: 'carry', items: [I.GIANT_SLAYER, I.INFINITY_EDGE, I.LAST_WHISPER] },
      { championId: 'vi', role: 'core' },
      { championId: 'darius', role: 'core' },
      { championId: 'leona', role: 'core' },
      { championId: 'garen', role: 'flex' },
      { championId: 'braum', role: 'flex' },
      { championId: 'ashe', role: 'flex' },
    ],
  },
];
