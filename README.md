# A.U.R.A. v1 — Implementação paralela por Lola

> **Implementação paralela por Lola (v1) — variante para comparação; o repo
> `derkauf/a.u.r.a.` continua sendo a fonte de verdade.**
>
> Este repo NÃO é o projeto oficial. É uma segunda implementação, feita pela
> Lola a partir da mesma documentação (Dispatch #1, Dispatch #2, plano de
> build e jornada Gemini), para o Diogo comparar com o repo dele, abrir no
> VS Code + Claude Code e explorar. Nada aqui toca no `derkauf/a.u.r.a.`.

## O que é

A.U.R.A. (Ambient User Responsive Automation) — automação residencial
espacial para Meta Quest, sem controles: a mão aponta, o pinch seleciona,
e o cômodo "lembra" onde cada painel está.

O loop da v1: **AprilTag na parede → âncora espacial persistente → painel
do dispositivo → cursor de raio da mão com snap magnético**. Um cômodo,
três dispositivos simulados, sem chamada de IA.

## Os 3 dispositivos

| Dispositivo | AprilTag (tag36h11) | Controles |
|---|---|---|
| Lâmpada da sala (`lamp-sala-01`) | id **1** | liga/desliga + brilho 0–100% (passo 5) |
| Ar-condicionado da sala (`ac-sala-01`) | id **2** | liga/desliga + temperatura 16–30 °C (passo 1) |
| Fechadura da porta (`lock-porta-01`) | id **3** | tranca/destranca + câmera (simulada) |

O fluxo do demo: aponte para o sticker do AprilTag na parede → pinch em
**"Ler tag"** → o painel do dispositivo aparece ancorado ali. Na segunda
sessão, os 3 painéis já estão lá, no mesmo lugar, sem re-ler nenhum tag.
Pinch liga/desliga (lâmpada e ar) ou tranca/destranca (fechadura);
temperatura e brilho persistem entre sessões.

Os stickers na tela são representações simplificadas no estilo AprilTag
(grade ilustrativa, não escaneável). Os tags imprimíveis de verdade estão
em `docs/apriltag-markers.md` (RealityScan Desktop ou PDFs oficiais).

## Pré-requisitos (instalar ANTES de rodar)

| Item | Para quê | Onde conseguir |
|---|---|---|
| **Node.js 20.19+ / 22.12+ / 24+** e npm | Rodar e compilar o app | nodejs.org — testado aqui com **Node v24.22.1, npm 10.9.4** |
| **VS Code** + Claude Code | Abrir o repo e desenvolver | O ambiente que você já usa |
| **Navegador Chrome/Chromium** | O emulador XR (IWER) roda dentro dele | Na primeira vez, o CLI baixa o Chromium sozinho (só na primeira vez) |
| **Meta Quest 3S** (modo desenvolvedor) | Teste no headset de verdade (segundo passo) | O seu, já com dev mode |
| **RealityScan Desktop** (grátis, Epic Games) | Gerar os AprilTags imprimíveis para colar na parede | `realityscan.com/download` (instala pelo Epic Games Launcher) — detalhes em `docs/apriltag-markers.md` |
| Git (opcional) | Versionar o seu repo | — |

**Não é preciso instalar o Meta XR Simulator (o app de desktop) para
este teste.** O teste da âncora roda no emulador que o `npm run dev` abre
no navegador (IWER), já configurado para o perfil Quest 3. O XR Simulator
standalone é outra ferramenta, para apps nativos (Unity/Unreal) — não para
este app WebXR. Se quiser instalá-lo mesmo assim, está na página de
downloads da Meta para desenvolvedores
(`https://developers.meta.com/vr/downloads/unreal/`).

## Comandos

```bash
# 1. Instalar as dependências (uma vez)
npm install

# 2. Rodar o app (é assim que você abre de manhã)
npm run dev
```

O servidor sobe em:

```text
https://localhost:8081/
```

(O endereço de rede, para abrir no Quest pela mesma Wi-Fi, aparece no
terminal quando o servidor sobe. Aceite o aviso de certificado local —
é esperado, o servidor usa um certificado de desenvolvimento.)

Outros comandos:

```bash
npm run typecheck   # checagem de tipos (tsc --noEmit) — rode antes de testar
npm run build       # build de produção (vite build) → dist/
npm run test:unit   # testes unitários dos módulos puros (tsx --test)
```

## O que você deve ver quando rodar

1. O navegador abre com o app: uma sala (`sunlit_living_room`) com 3
   stickers brancos no alto (um por dispositivo) e, abaixo de cada um, o
   espaço do painel — **os painéis começam escondidos** (só aparecem
   depois que o tag é "lido").
2. No emulador (IWER), entre na sessão XR (perfil Quest 3, já configurado
   em `iwsdk.config.json`). Use o mouse/teclado do emulador para simular
   as mãos, ou pareie o Quest 3S.
3. Aponte para um sticker e faça pinch no botão **"Ler tag"**: o painel
   do dispositivo aparece abaixo do sticker.
4. O cursor é um anel branco na ponta do dedo; sobre um controle ele
   gruda no centro do alvo, cresce e fica âmbar (snap magnético).

## Primeiro teste — round-trip da âncora (obrigatório)

O procedimento completo está em `tests/anchor-roundtrip.md`. Resumo:

1. **Sessão 1:** leia os 3 tags ("Ler tag" em cada sticker). Os 3 painéis
   aparecem; a linha da âncora em cada um diz **"Âncora: ativa"**.
2. **Sessão 2:** entre de novo, no mesmo lugar, **sem tocar nos stickers**.
   Os 3 painéis já estão lá, no mesmo XYZ; a linha diz
   **"Âncora: ativa (restaurada)"**.
3. Teste os controles e saia/entre de novo: os valores persistem.

Se falhar, o teste manda parar e registrar o erro exato — ver o doc do
teste. Os eventos ficam registrados em `localStorage`
(`aura_anchor_test_log`).

## Como funciona (resumo da arquitetura)

- `src/markers/apriltag-handshake.ts` — os 3 tags (`tag36h11`, ids 1/2/3)
  e os descritores de dispositivo que cada tag resolve.
- `src/devices/device-registry.ts` — fonte única de verdade do estado
  (liga/desliga, temperatura, brilho, tranca) + vínculos; persiste em
  `localStorage`; todo update passa por um caminho único com regras.
- `src/core/rules.ts` — regras locais determinísticas (clamp + passo).
- `src/anchors/anchor-service.ts` — liga `XRAnchor` aos painéis
  vinculados; observa a âncora nativa do SDK e registra o log do teste.
- `src/ui/device-panel-system.ts` — liga stickers e painéis (UIKitML) ao
  registro, guiado pelo schema de controles de cada dispositivo.
- `src/input/hand-ray-cursor.ts` — cursor de raio da mão com snap magnético.
- `src/ai/providers/provider-interface.ts` — interface de provedor de IA
  (stub). **Nenhuma chamada de IA no v1**; `jev` e `laya` falham
  explicitamente até serem implementados depois do v1.
- `public/scenes/main.iwsdk.scene.json` — composição: 3 stickers, 3
  painéis, placeholder da câmera, luzes. Origem livre (o jogador nasce
  em 0,0,0 olhando para os painéis).
- `public/ui/*.uikitml` — os 7 painéis (Horizon kit). Tamanhos em unidades
  UIKit (1 unidade = 1 cm em escala 1); nós com escala 0,1 → painéis de
  0,46 m a 60 cm do usuário.
- `tests/anchor-roundtrip.md` — o teste do Dispatch #1.
- `docs/apriltag-markers.md` — AprilTags, ids e como gerar os imprimíveis.
- `docs/ux/device-panel-spec.md` — especificação dos painéis.

## O que é simulado / não verificado (leia antes de julgar)

- **Leitura do AprilTag é simulada.** Não há detecção por câmera no v1
  (a pergunta da permissão da Passthrough Camera API continua em aberto).
  O pinch no botão "Ler tag" representa "a câmera leu o tag". O fluxo
  depois da leitura é o mesmo do plano.
- **Dispositivos são simulados** (`control_target: sim://…`). Nenhum
  hardware real, nenhum Matter, nenhum Home Assistant.
- **Câmera da fechadura é um placeholder** (painel com "Sem feed real").
- **Os stickers na tela não são AprilTags de verdade.** A grade 6×6 é
  ilustrativa (bits pseudo-aleatórios, não codewords válidos). Os tags
  imprimíveis de verdade vêm do RealityScan ou dos PDFs oficiais.
- **Persistência da âncora depende do SDK e do navegador.** O mecanismo
  (UUID persistido + restore) foi verificado no código do SDK instalado;
  o comportamento em tempo de execução (emulador e Quest 3S) só se prova
  com o teste de round-trip — é o primeiro teste a rodar.
- **Verificado aqui (nesta máquina):** `npm run typecheck` limpo,
  `npm run test:unit` 12/12, `npm run build` OK, `npm run dev` sobe e
  serve o app em `https://localhost:8081/` (Vite pronto em ~4 s).
  **Não verificado aqui:** renderização no navegador gerenciado (o
  Chromium do CLI estava baixando quando o servidor foi parado), sessão
  XR no emulador, clique/pinch nos controles, e o teste de round-trip —
  tudo isso roda na sua máquina, no `npm run dev`.
- **Detalhes visuais a confirmar no emulador:** se os glifos `°C`, `ã`,
  `ç` renderizam certos na fonte do UIKitML; se o `display: none` do
  painel some mesmo com o raycast; se o clique no sticker funciona
  também fora do botão "Ler tag".

## Glossário (termos que aparecem no código)

- **XR** — sessão imersiva (o app rodando dentro do headset ou do
  emulador, em realidade virtual/mista).
- **IWER** — o emulador XR dentro do navegador: ele finge ser um Quest
  para o app WebXR, sem precisar do headset. É o que o `npm run dev`
  abre. Perfil configurado: Quest 3.
- **ECS** — entity-component system: o jeito do IWSDK organizar o app.
  Entidades são coisas na cena; componentes são os dados delas; sistemas
  são o comportamento que roda a cada frame.
- **Âncora espacial (persistente)** — um ponto fixo no cômodo que o
  headset lembra entre sessões. O painel fica preso a ele e reaparece no
  mesmo lugar físico.
- **AprilTag** — marcador preto-e-branco que uma câmera identifica por
  um número (id). Criado pelo APRIL Robotics Lab da Universidade de
  Michigan. O tag só carrega o id; o que ele significa vive no app.
- **Pinch** — o gesto de pinça (polegar + indicador) que seleciona coisas
  no Quest com hand tracking.
- **Snap magnético** — o cursor "gruda" no centro do controle quando o
  raio da mão passa por perto, para o pinch acertar fácil.

## AR Code (ar-code.com) — avaliado, não usado na v1

O Diogo mandou o link do AR Code (serviço de QR codes de realidade
aumentada). Avaliei: ele gera QR codes que abrem experiências WebAR
hospedadas na plataforma dele (modelos 3D, vídeos, textos) — o QR aponta
para a URL da AR Code, não carrega o nosso payload, e o serviço não
oferece detecção de tag dentro de um app WebXR nem API para o nosso
handshake. Não dá um caminho concreto para a v1, então o handshake
continua simulado/hardcoded e o AR Code fica como **opção a explorar**:
por exemplo, adesivos imprimíveis que, escaneados com o celular, mostram
uma prévia 3D de cada dispositivo — material de demonstração para a
competição, não parte do loop do app.

## Histórico das decisões (para comparar com o seu repo)

- Entrega: WebXR / IWSDK (TypeScript + Vite), não o caminho nativo
  (Meta Spatial SDK) do plano de setembro — decisão de 11/nov.
- Marcador: AprilTag (`tag36h11`, ids 1/2/3) em vez de QR code — o tag
  carrega só o id; o descritor do dispositivo vive no app.
- Hospedagem do link público: **Vercel** (projeto `aura-v1-lola`). A Fase 1
  está no ar em https://aura.sixvectors.app/ (tag `fase-1`), com um
  ambiente de desenvolvimento separado em https://aura-dev.sixvectors.app/.
  A publicação é manual, com `npm run deploy` / `npm run deploy:dev`; um
  push no GitHub não publica nada.
- Scope travado: 1 cômodo, 3 dispositivos simulados, mãos primeiro,
  sem IA no v1.
