# Registro na Riot + compliance (camada 2 / Overwolf)

A camada 2 (estado do jogo ao vivo) lê os dados via **Overwolf GEP**, não pela Riot API.
Mesmo assim, um app que integra com jogos da Riot exige **aprovação da Riot** pra publicar.

## Registro (Riot Developer Portal)

- **App ID:** 883379
- **Tipo:** Personal
- **Game Focus:** Teamfight Tactics
- **URL:** https://github.com/daKires/TFT-OpenOverlay
- **Status:** Pending Review (registrado em 2026-09-21)

A aprovação é **gate de publicação** — o teste local (app Overwolf "unpacked") não precisa dela.

## Descrição enviada

> TFT-OpenOverlay is a free, open-source companion overlay for Teamfight Tactics that helps
> players decide what to build. It reads only the local player's own live game state (board,
> bench, gold, level, shop) through the Overwolf Game Events Provider and suggests which meta
> comps best fit what the player already has, explaining the reasoning (unit overlap, item
> buildability, meta strength). It does not use the Riot API for live gameplay data and does
> not access other players' private information. It does not display Legend or Augment win
> rates, augment average placements, or any augment data. If Riot API access is enabled later,
> it would only be read-only TFT endpoints (tft-summoner / tft-match) for post-game stats.
> Source (MIT): https://github.com/daKires/TFT-OpenOverlay

## Compliance obrigatório

- **NÃO** incluir dados de augment.
- **NÃO** exibir win rates de Legend/Augment nem colocação média de augment.
- Exibir o disclaimer: *"TFT-OpenOverlay isn't endorsed by Riot Games and doesn't reflect the
  views or opinions of Riot Games or anyone officially involved in producing or managing Riot
  Games properties."*
- Nada que dê vantagem injusta / incentive metagaming.

Fontes: [Overwolf TFT GEP](https://dev.overwolf.com/ow-native/live-game-data-gep/supported-games/teamfight-tactics/) ·
[TFT compliance](https://dev.overwolf.com/ow-electron/guides/game-compliance/teamfight-tactics/) ·
[Riot Developer Portal](https://developer.riotgames.com/docs/portal)
