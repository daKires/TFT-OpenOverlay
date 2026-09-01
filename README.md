# TFT-OpenOverlay — Camada 1: Sugeridor de Comps (o "cérebro")

Dado **o que o jogador tem** — unidades (campeões) + **componentes de item soltos** —, este
módulo sugere e ranqueia as **comps do meta** que mais combinam, explicando o porquê.

É a **camada 1** de um helper de Teamfight Tactics. Ela é o "cérebro": **não** faz visão
computacional, **não** é overlay, **não** depende de como o estado do jogo é lido. A entrada é um
objeto simples (`HeldState`); hoje uma telinha monta esse objeto na mão, amanhã ele pode vir de
visão computacional, do Overwolf ou da API da Riot — **sem mudar o cérebro**.

## Como rodar

```bash
npm install

# 1) Abrir a telinha de teste (UI) no navegador:
npm run dev          # abre em http://localhost:5173

# 2) Rodar os testes automáticos do cérebro:
npm test

# (extras)
npm run typecheck    # confere os tipos
npm run build        # build de produção da UI
```

Na UI: escolha as **unidades** que você tem (busca + clique) e clique nas **peças** (componentes)
que você tem na bancada — pode repetir a mesma peça (ex. 2× B.F. Sword). O **Top 3** atualiza na
hora, com o motivo de cada uma.

## Como ele decide (os 3 sinais)

O ranking combina **encaixe × força**, do jeito que os apps de referência (MetaTFT, tactics.tools,
tft-advisor) fazem:

1. **Unidades** — quais unidades da comp você já tem. O **carry pesa muito mais** que um flex.
2. **Itens** — o quanto seus **componentes soltos montam os itens ideais (BiS) do carry**. Item
   completo conta cheio; **falta 1 componente** conta meio; e a mesma peça nunca é contada duas
   vezes (alocação conjunta).
3. **Força no meta** — a **colocação média** da comp (menor = melhor; ~4.5 = neutro). Ela só
   **desempata** entre comps de encaixe parecido.

`score = (peso_unidades · unidades + peso_itens · itens) × fator_de_força`. Tudo é configurável em
[`src/core/scoring/weights.ts`](src/core/scoring/weights.ts) (`ScoringOptions`).

## Arquitetura (o desacoplamento)

```
src/core/           # O CÉREBRO — TypeScript puro, sem UI. É o que vai ser plugado no app maior.
  domain/           # os 8 componentes base (nomes técnicos estáveis do CommunityDragon)
  items/            # ItemRecipeBook (interface) + receitas (par de componentes -> item)
  repository/       # CompRepository (interface) — a fonte das comps
  fixtures/         # DADOS DE EXEMPLO (fictícios): itens, campeões, 5 comps
  scoring/          # unitOverlap, itemBuildability, metaStrength, suggestComps, explain
  index.ts          # API pública
src/web/            # A UI — só um ADAPTADOR: monta o HeldState e chama suggestComps
test/               # testes (Vitest) do cérebro
```

Ponto central: `suggestComps(held, comps, { book })` é uma **função pura**. As duas fontes de dados
são **interfaces plugáveis**:

- `CompRepository` — de onde vêm as comps do meta.
- `ItemRecipeBook` — a tabela de receitas de item.

## Plugando dados reais depois

Hoje tudo é fixture fictícia. Pra usar dados reais, é só implementar as interfaces (sem tocar no
scorer):

- **Itens/receitas + campeões**: [CommunityDragon](https://raw.communitydragon.org/latest/cdragon/tft/en_us.json)
  (cada item traz o campo `composition` = os 2 componentes).
- **Comps do meta**: API não-oficial do MetaTFT (`api-hc.metatft.com/tft-comps-api/`) ou o MCP oficial
  do op.gg.

## Exemplo de uso (código)

```ts
import { suggestComps, createDefaultRecipeBook, EXAMPLE_COMPS, championName, COMPONENTS } from './src/core/index';

const held = {
  units: [{ championId: 'jinx' }],
  components: [COMPONENTS.BF_SWORD, COMPONENTS.RECURVE_BOW], // montam Giant Slayer
};

const top3 = suggestComps(held, EXAMPLE_COMPS, { book: createDefaultRecipeBook(), championName }).slice(0, 3);
console.log(top3[0].comp.name, top3[0].explanation);
```

## Nota sobre os dados

Os campeões usam nomes reconhecíveis só pra ficar intuitivo de conferir, mas as **comps, traits e
estatísticas são fictícias** — servem pra exercitar o scorer. As 8 receitas "dobradas" (ex. B.F.
Sword ×2 = Deathblade) são estáveis; os cruzamentos usam nomes clássicos e **não** estão amarrados a
um patch específico. O conjunto real virá do CommunityDragon depois, atrás da mesma interface.
