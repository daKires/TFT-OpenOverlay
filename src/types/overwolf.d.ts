// Tipos MÍNIMOS do cliente Overwolf (Game Events Provider). A API global
// `overwolf` é INJETADA pelo cliente Overwolf em runtime — NÃO é um pacote npm.
// Aqui declaramos só o que src/integrations/overwolf.ts usa. Fica fora de
// src/core (o núcleo é puro e não sabe da existência disto).

declare namespace overwolf {
  /** Payload de onInfoUpdates2: a seção alterada vem dentro de `info`. */
  interface GepInfoUpdate {
    info?: unknown;
    feature?: string;
    category?: string;
    key?: string;
  }

  interface GamesEvents {
    /** Assina as features desejadas do GEP (ex. 'me', 'match_info', 'board'). */
    setRequiredFeatures(features: string[], cb: (result: unknown) => void): void;
    /** Snapshot do estado atual (uma vez, ao assinar). */
    getInfo(cb: (info: unknown) => void): void;
    onInfoUpdates2: {
      addListener(cb: (update: GepInfoUpdate) => void): void;
      removeListener(cb: (update: GepInfoUpdate) => void): void;
    };
    onNewEvents: {
      addListener(cb: (events: unknown) => void): void;
    };
  }

  interface GameInfo {
    id?: number;
    isRunning?: boolean;
  }

  interface Games {
    events: GamesEvents;
    onGameInfoUpdated: {
      addListener(cb: (info: GameInfo) => void): void;
    };
    /** Opcional: nem toda versão do cliente expõe. */
    onGameLaunched?: {
      addListener(cb: (info: GameInfo) => void): void;
    };
  }

  interface ObtainDeclaredWindowResult {
    status?: string;
    window?: { id?: string; name?: string };
  }

  interface Windows {
    obtainDeclaredWindow(name: string, cb: (result: ObtainDeclaredWindowResult) => void): void;
    restore(id: string, cb?: (result: unknown) => void): void;
    hide(id: string, cb?: (result: unknown) => void): void;
    getMainWindow(): { id?: string; name?: string };
  }

  interface Overwolf {
    games: Games;
    windows: Windows;
  }
}

declare const overwolf: overwolf.Overwolf;
