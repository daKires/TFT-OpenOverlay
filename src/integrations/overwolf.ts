import type { Champion, ChampionId, HeldState, HeldUnit, UnitLocation } from '../core/index';

// Integração com o Overwolf (Game Events Provider) — "Camada 2". Fica FORA de
// src/core: o núcleo é puro e não sabe da existência disto. Só importamos TIPOS
// do core. A API global `overwolf` é injetada pelo cliente Overwolf (ver
// src/types/overwolf.d.ts), não é pacote npm.
//
// MVP: mapeamos só UNIDADES (board/bench) + ECONOMIA (ouro/nível/estágio/HP).
// Componentes de item soltos, itens/estrelas e o Jev ficam FORA.

// Detecção de ambiente igual à do Tauri: a global é injetada pelo cliente.
export const isOverwolf = typeof (globalThis as any).overwolf !== 'undefined';

// ---------------------------------------------------------------------------
// Payload do GEP que consumimos (leve, tolerante)
// ---------------------------------------------------------------------------
// Os valores do GEP chegam como strings ou JSON-string; por isso os campos são
// amplos e o parsing é defensivo (Number(...) + JSON.parse em try/catch).

export interface GepMe {
  gold?: string | number;
  level?: string | number;
  health?: string | number;
}

export interface GepMatchInfo {
  round?: string | number;
  stage?: string | number;
}

/** Uma peça (unidade) do tabuleiro/banco. */
export interface GepPiece {
  championId?: string;
  champion_id?: string;
  id?: string;
  name?: string;
  location?: string;
  star?: string | number;
}

/** board/bench podem vir como array de peças ou objeto indexado por slot. */
export type GepPieceCollection = GepPiece[] | Record<string, GepPiece>;

export interface GepInfo {
  me?: GepMe | string;
  match_info?: GepMatchInfo | string;
  board?: GepPieceCollection | string;
  bench?: GepPieceCollection | string;
}

// ---------------------------------------------------------------------------
// Estado mapeado (a saída que alimenta o cérebro)
// ---------------------------------------------------------------------------

export interface OverwolfEconomy {
  gold?: number;
  level?: number;
  stage?: string;
  hp?: number;
}

export interface OverwolfState {
  units: HeldState['units'];
  economy: OverwolfEconomy;
}

// ---------------------------------------------------------------------------
// Helpers de parsing tolerante (puros)
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Lê um campo cru de um objeto (sem parse). */
function field(source: unknown, key: string): unknown {
  if (!isRecord(source)) return undefined;
  return source[key];
}

/** Aceita objeto ou JSON-string; devolve o objeto parseado ou undefined. */
function parseJsonish<T = unknown>(value: unknown): T | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') {
    const s = value.trim();
    if (s === '') return undefined;
    try {
      return JSON.parse(s) as T;
    } catch {
      return undefined;
    }
  }
  if (typeof value === 'object') return value as T;
  return undefined;
}

/** Lê uma seção do info (`me`, `match_info`, ...) tolerando JSON-string. */
function section(info: unknown, key: string): Record<string, unknown> | undefined {
  return parseJsonish<Record<string, unknown>>(field(info, key));
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'string') {
    const n = Number(value.trim());
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function toStar(value: unknown): 1 | 2 | 3 | undefined {
  const n = toNumber(value);
  return n === 1 || n === 2 || n === 3 ? n : undefined;
}

function toLocation(value: unknown): UnitLocation | undefined {
  if (typeof value !== 'string') return undefined;
  const v = value.toLowerCase();
  return v === 'board' || v === 'bench' ? v : undefined;
}

function firstString(...values: unknown[]): string | undefined {
  for (const v of values) {
    if (typeof v === 'string' && v.trim() !== '') return v;
  }
  return undefined;
}

/** Normaliza nome/id pra casar: lowercase, sem acento, sem espaços/pontuação. */
function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/** Índice de resolução: id exato e nome/id normalizados -> ChampionId. */
function buildIndex(champions: Champion[]): Map<string, ChampionId> {
  const index = new Map<string, ChampionId>();
  for (const c of champions) {
    index.set(c.id, c.id);
    const idKey = normalizeKey(c.id);
    if (idKey) index.set(idKey, c.id);
    const nameKey = normalizeKey(c.name);
    if (nameKey) index.set(nameKey, c.id);
  }
  return index;
}

/** Resolve uma peça pro ChampionId (id exato ou nome/id normalizado). */
function resolveChampion(piece: GepPiece, index: Map<string, ChampionId>): ChampionId | undefined {
  const rawId = firstString(piece.championId, piece.champion_id, piece.id);
  if (rawId) {
    const exact = index.get(rawId);
    if (exact) return exact;
    const norm = normalizeKey(rawId);
    const byId = index.get(norm);
    if (byId) return byId;
  }
  const rawName = firstString(piece.name);
  if (rawName) {
    const byName = index.get(normalizeKey(rawName));
    if (byName) return byName;
  }
  return undefined;
}

/** Normaliza board/bench (array ou objeto por slot, cru ou JSON-string). */
function piecesOf(value: unknown): GepPiece[] {
  const parsed = parseJsonish(value);
  if (Array.isArray(parsed)) return parsed.filter(isRecord) as GepPiece[];
  if (isRecord(parsed)) return Object.values(parsed).filter(isRecord) as GepPiece[];
  return [];
}

function readStage(match: Record<string, unknown>): string | undefined {
  const raw = match.stage ?? match.round;
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === 'string') {
    const s = raw.trim();
    return s === '' ? undefined : s;
  }
  if (typeof raw === 'number') return String(raw);
  return undefined;
}

// ---------------------------------------------------------------------------
// Mapeamento GEP -> estado (PURO)
// ---------------------------------------------------------------------------

/**
 * Converte o payload do GEP num estado do jogador (unidades + economia).
 * PURO: não toca em `overwolf`, só lê o objeto recebido.
 *
 * Regras:
 * - peças do board/bench viram HeldUnit SOMENTE se o campeão for reconhecido
 *   (id exato ou nome/id normalizado em `champions`); desconhecido é IGNORADO.
 * - economia vem de `me` (gold, level, health->hp) e o estágio de `match_info`.
 */
export function mapGepToHeld(info: unknown, champions: Champion[]): OverwolfState {
  const index = buildIndex(champions);
  const units: HeldUnit[] = [];

  const collect = (raw: unknown, fallback: UnitLocation) => {
    for (const piece of piecesOf(raw)) {
      const championId = resolveChampion(piece, index);
      if (!championId) continue; // desconhecido: ignora, não quebra
      const unit: HeldUnit = { championId, location: toLocation(piece.location) ?? fallback };
      const star = toStar(piece.star);
      if (star) unit.star = star;
      units.push(unit);
    }
  };

  collect(field(info, 'board'), 'board');
  collect(field(info, 'bench'), 'bench');

  const me = section(info, 'me') ?? {};
  const match = section(info, 'match_info') ?? {};

  const economy: OverwolfEconomy = {};
  const gold = toNumber(me.gold);
  if (gold !== undefined) economy.gold = gold;
  const level = toNumber(me.level);
  if (level !== undefined) economy.level = level;
  const hp = toNumber(me.health);
  if (hp !== undefined) economy.hp = hp;
  const stage = readStage(match);
  if (stage !== undefined) economy.stage = stage;

  return { units, economy };
}

// ---------------------------------------------------------------------------
// Assinatura do GEP (GUARDADA: no-op fora do Overwolf)
// ---------------------------------------------------------------------------

/** Merge raso-recursivo das seções do info acumulado (objetos se fundem). */
function mergeInfo(base: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    const prev = parseJsonish(out[k]);
    const next = parseJsonish(v);
    if (isRecord(prev) && isRecord(next)) out[k] = mergeInfo(prev, next);
    else out[k] = v;
  }
  return out;
}

/**
 * Assina o estado do TFT no Overwolf e chama `cb` a cada atualização, já
 * mapeado por mapGepToHeld. Fora do Overwolf (browser/testes) é no-op.
 * Devolve a função de cancelamento (removeListener).
 */
export function subscribeOverwolfState(
  champions: Champion[],
  cb: (s: OverwolfState) => void,
): () => void {
  if (!isOverwolf) return () => {};

  let accumulated: Record<string, unknown> = {};
  const emit = (patch: unknown) => {
    accumulated = mergeInfo(accumulated, parseJsonish<Record<string, unknown>>(patch) ?? {});
    cb(mapGepToHeld(accumulated, champions));
  };

  const onInfoUpdate = (update: unknown) => emit(field(update, 'info'));

  const events = overwolf.games.events;
  // getInfo devolve { status, res: {...} }; o info fica em `res`.
  events.getInfo((data) => emit(field(data, 'res') ?? data)); // snapshot inicial (uma vez)
  events.onInfoUpdates2.addListener(onInfoUpdate);

  return () => {
    events.onInfoUpdates2.removeListener(onInfoUpdate);
  };
}
