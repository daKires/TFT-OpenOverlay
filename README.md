# TFT-OpenOverlay — Camada 1: Sugeridor de Comps (o "cérebro")

Dado **o que o jogador tem** — unidades (campeões) + **componentes de item soltos** —, este
módulo sugere e ranqueia as **comps do meta** que mais combinam, explicando o porquê.

É a **camada 1** de um helper de Teamfight Tactics. Ela é o "cérebro": **não** faz visão
computacional, **não** é overlay, **não** depende de como o estado do jogo é lido. A entrada é um
objeto simples (`HeldState`); hoje uma telinha monta esse objeto na mão, amanhã ele pode vir de
visão computacional, do Overwolf ou da API da Riot — **sem mudar o cérebro**.

> **É um app LOCAL. Não existe site hospedado nem deploy.** Você clona o repositório, roda
> `npm install` e `npm run dev` na sua própria máquina. Tudo roda localmente; a única coisa que
> pode usar rede é o importador (`npm run import`) e o **Jev**, que é **opcional** e roda no seu
> servidor local.

## Como rodar

```bash
git clone <url-do-repo>
cd TFT-OpenOverlay
npm install

# 1) Abrir a telinha de teste (UI) no navegador:
npm run dev          # abre em http://localhost:5173

# 2) Rodar os testes automáticos do cérebro:
npm test

# (extras)
npm run typecheck    # confere os tipos
npm run build        # build de produção da UI
```

> Este é um **app local**: não há ambiente online. Todo o fluxo é `clone` + `npm install` +
> `npm run dev` na sua máquina.

Na UI: escolha as **unidades** que você tem (busca + clique) e clique nas **peças** (componentes)
que você tem na bancada — pode repetir a mesma peça (ex. 2× B.F. Sword). O **Top 3** atualiza na
hora, com o motivo de cada uma.

## Jev (opcional)

O app tem integração com o **Jev** (TypeSafe AI), mas ela é **totalmente opcional** e roda **LOCAL**:

- Para usar, você precisa da **SUA própria chave** da TypeSafe, colocada num arquivo `.env` **na raiz
  do projeto**:

  ```bash
  JEV_API_KEY=sua_chave_aqui
  ```

  (veja o modelo em [`.env.example`](.env.example)).

- No **navegador** (`npm run dev`), a análise passa pelo **proxy do Vite**, que lê a chave do `.env`
  **apenas no servidor local** — a chave **nunca vai pro bundle**.
- No **app desktop** (Tauri), a chave é configurada por uma **tela dentro do app** e guardada num
  store local; a chamada ao Jev é feita pelo **backend em Rust**, não pelo navegador.
- **Sem chave, o app cai automaticamente no suggester determinístico** e funciona normalmente — você
  não precisa de chave nenhuma pra usar o app.

## Instalador desktop (Tauri)

O app pode ser empacotado como um **executável desktop** (Windows) via
[Tauri](https://tauri.app/). Pré-requisitos (uma vez): **Rust** ([rustup](https://rustup.rs)) e o
**Microsoft C++ Build Tools** (workload "Desktop development with C++"); no Windows 11 o WebView2 já
vem instalado.

```bash
npm install
npx tauri icon caminho/para/um-logo.png   # gera os ícones (1ª vez; use seu próprio logo)
npm run tauri:dev                           # abre o app desktop em modo dev
npm run tauri build                         # gera o instalador
```

O instalador sai em `src-tauri/target/release/bundle/` (`.msi` e `.exe`/NSIS). No app, use a tela
**"Chave do Jev"** pra colar sua chave; sem chave, roda o determinístico. Assinatura de código,
auto-update e outros sistemas operacionais ficam pra próximas fases.

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

## Dados reais do set atual (importador)

Por padrão o app usa **dados de exemplo**. Pra trazer os dados **reais do set atual** (Set 18
"Enchanted Wilds") — campeões, traits, itens/receitas e comps do meta —, rode o importador **na sua
máquina** (precisa de internet aberta pro CommunityDragon e o MetaTFT):

```bash
npm run import
```

Ele baixa e monta `src/data/set18.json`; o app passa a usar esses dados automaticamente (o rodapé
mostra "Dados reais: …"). Rode 1 vez e **commite** o `set18.json` gerado. Opções:

```bash
npm run import -- --patch=18.1                       # fixa um patch em vez de "latest"
npm run import -- --rank=MASTER,GRANDMASTER,CHALLENGER   # bracket de elo das comps
npm run import -- --from-samples --out=/tmp/x.json    # dry-run offline (sem rede), pra testar o fluxo
```

**Como funciona / fontes:**
- **Itens/receitas + campeões + traits**: [CommunityDragon](https://raw.communitydragon.org/latest/cdragon/tft/en_us.json)
  (cada item traz `composition` = os 2 componentes; os campeões vêm do set de maior número).
- **Comps do meta**: API não-oficial do MetaTFT (`api-hc.metatft.com/tft-comps-api/`).

O importador imprime um **relatório** (set/patch, nº de itens/campeões/comps e referências que não
casaram). O MetaTFT é não-oficial: se ele falhar ou nenhuma comp casar, o app **mantém as comps de
exemplo** e avisa — nesse caso, me mande o relatório que eu ajusto o mapeamento. Nada disso toca no
cérebro (`src/core`), que continua puro e offline; o importador é um script à parte (`scripts/import`).

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

Enquanto você não roda `npm run import`, os dados são de **exemplo**: os campeões usam nomes
reconhecíveis só pra ficar intuitivo de conferir, mas as **comps, traits e estatísticas são
fictícias** — servem pra exercitar o scorer. As 8 receitas "dobradas" (ex. B.F. Sword ×2 =
Deathblade) são estáveis; os cruzamentos usam nomes clássicos. O ponto de entrada de dados é o
`loadData()` (em `src/core/data`), que usa os dados reais do `set18.json` quando existem e cai nos de
exemplo quando não — a UI e os testes consomem daí sem saber a origem.

## Licença

Este projeto é distribuído sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para o texto
completo.