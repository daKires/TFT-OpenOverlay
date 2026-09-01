import type { ChampionId } from '../ids';
import type { Champion } from '../types';

// DADOS DE EXEMPLO. Nomes de campeões reconhecíveis (só pra ficar intuitivo de
// conferir); as traits e as comps que os usam são FICTÍCIAS. O conjunto real
// virá de uma fonte de dados depois, atrás do CompRepository.

export const EXAMPLE_CHAMPIONS: Champion[] = [
  { id: 'jinx', name: 'Jinx', cost: 4, traits: ['Sniper', 'Rebel'] },
  { id: 'caitlyn', name: 'Caitlyn', cost: 3, traits: ['Sniper', 'Enforcer'] },
  { id: 'ashe', name: 'Ashe', cost: 2, traits: ['Sniper', 'Spirit'] },
  { id: 'ezreal', name: 'Ezreal', cost: 3, traits: ['Sniper', 'Sorcerer'] },
  { id: 'ahri', name: 'Ahri', cost: 4, traits: ['Sorcerer', 'Spirit'] },
  { id: 'lux', name: 'Lux', cost: 3, traits: ['Sorcerer', 'Guardian'] },
  { id: 'morgana', name: 'Morgana', cost: 5, traits: ['Sorcerer', 'Guardian'] },
  { id: 'lulu', name: 'Lulu', cost: 1, traits: ['Spirit', 'Sorcerer'] },
  { id: 'katarina', name: 'Katarina', cost: 4, traits: ['Assassin', 'Rebel'] },
  { id: 'akali', name: 'Akali', cost: 3, traits: ['Assassin', 'Spirit'] },
  { id: 'yasuo', name: 'Yasuo', cost: 2, traits: ['Assassin', 'Rebel'] },
  { id: 'sett', name: 'Sett', cost: 5, traits: ['Bruiser', 'Enforcer'] },
  { id: 'darius', name: 'Darius', cost: 2, traits: ['Bruiser', 'Enforcer'] },
  { id: 'garen', name: 'Garen', cost: 1, traits: ['Bruiser', 'Guardian'] },
  { id: 'vi', name: 'Vi', cost: 3, traits: ['Enforcer', 'Bruiser'] },
  { id: 'leona', name: 'Leona', cost: 2, traits: ['Guardian', 'Enforcer'] },
  { id: 'braum', name: 'Braum', cost: 2, traits: ['Guardian', 'Bruiser'] },
  { id: 'soraka', name: 'Soraka', cost: 4, traits: ['Spirit', 'Guardian'] },
];

const CHAMPION_BY_ID = new Map<ChampionId, Champion>(EXAMPLE_CHAMPIONS.map((c) => [c.id, c]));

export function championName(id: ChampionId): string {
  return CHAMPION_BY_ID.get(id)?.name ?? id;
}

export function getChampion(id: ChampionId): Champion | undefined {
  return CHAMPION_BY_ID.get(id);
}
