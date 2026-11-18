# Status do A.U.R.A. para a Lola

Exportação do estado do repositório `aura-v1-lola` para quem acompanha o projeto sem acesso ao código. Só fatos verificáveis no repositório; o que não pôde ser verificado está marcado como **não verificado**.

**Versão deste status:** 2026-11-18, quarta versão
**Último commit:** `864661e` (dev notes), sobre `6768fea` (código da Phase 3 publicado na produção). A página de entrada e o guia do usuário ainda **não têm commit** (estão só no aura-dev, esperando o teste do usuário).

---

## 1. Resumo

O A.U.R.A. (Ambient User Responsive Automation) é um app de automação residencial espacial, hands-first, para Meta Quest. Cada dispositivo da casa é representado por um AprilTag (`tag36h11`) impresso e colado ao lado dele; a câmera do Quest lê o tag e o app abre os controles do dispositivo ali, na frente do tag. É um **MVP**: os dispositivos são **simulados** (sem conversa com aparelhos reais); a experiência é a de controlar a casa pelo ambiente. São quatro dispositivos de teste: lâmpada (tag 1), ar-condicionado (tag 2), fechadura (tag 3) e TV (tag 10).

- **Stack:** WebXR com Immersive Web SDK (IWSDK) `@iwsdk/core` 1.1.0, TypeScript, Vite, painéis em UIKitML, detector de AprilTag `js-aruco2` (MIT), hospedagem na Vercel.
- **Produção (link dos juízes):** https://aura.sixvectors.app/, **na Phase 3 desde 17/11** (commit `6768fea`).
- **Fases congeladas:** Phase 1 em https://aura-phase1.sixvectors.app/; Phase 2 em https://aura-phase2.sixvectors.app/.
- **Desenvolvimento:** https://aura-dev.sixvectors.app/: a produção mais a página de entrada e o guia do usuário.

## 2. Para o texto do Devpost e o vídeo (importante)

- **A leitura pela câmera tem duas condições:** o juiz precisa dos **tags impressos** e precisa **liberar a câmera** com a opção **"Headset cameras"** do navegador do Quest. Só "Virtual cameras" mostra o avatar, e a imagem fica preta.
- **Sem tags ou sem câmera, o app funciona assim mesmo**, pelos ícones de tag simulados do HUD (como na Phase 1). Vale dizer isso no texto, para o juiz não achar que algo quebrou.
- **Tags para imprimir:** `public/guide/aura-apriltags-tag36h11.pdf` (publicado em `/guide/aura-apriltags-tag36h11.pdf` quando a página de entrada for para a produção).
- **Guia ilustrado (roteiro do vídeo):** `docs/guide/aura-user-guide.pdf`, 15 páginas 16:9, em inglês, gerado por `tools/generate-user-guide.py`.
- **A posição dos tags lidos não fica salva:** ao recarregar a página, é preciso escanear de novo (a âncora dos ícones simulados continua persistente).
- **Inspiração declarada:** AR por marcador, do post do usuário de 2010 (https://derkauf.wordpress.com/2010/03/12/augmented-reality/), e o vídeo de referência do cartão de AC (`docs/ux/user-interface-refs/aura-snap-specs-ac-ar-demo-2026-10-11.mp4`).

## 3. O que mudou desde o último status

Desde a terceira versão (17/11):

- **Nova identidade visual aplicada ao app** (concept boards de 17/11, mesma direção da imagem do Devpost): "ciano repousa, âmbar age". Tokens com os hex amostrados dos boards em `docs/ux/VISUAL_ID.md` (seção 5 abaixo). Arquivos: `public/ui/*.uikitml`.
- **Scanner de tags pela câmera:** botão de scan ao lado da engrenagem abre a janela "Tag scanner", com a imagem ao vivo da câmera. Arquivos: `src/camera/tag-scanner-system.ts`, `public/ui/tag-scanner.uikitml`, `public/ui/scan-button.uikitml`.
- **Detector de AprilTag** com o dicionário dos 12 tags impressos: `src/markers/apriltag-detector.ts`.
- **Tag lido → dispositivo aberto no lugar do tag:** a janela abre na frente do tag físico, 24 cm acima, com movimento suavizado, sempre virada para o usuário enquanto ele anda; um **tag virtual** (o mesmo código do papel) aparece sobre o tag impresso e abre/fecha a janela com um pinch. Arquivos: `src/markers/tag-placement.ts`, `src/ui/hud-follow-system.ts`.
- **TV como quarto dispositivo** (tag 10, "00a" no PDF): liga/desliga e volume; aparece só pela câmera. Arquivos: `public/ui/panel-tv.uikitml`, `public/ui/sticker-tv.uikitml`.
- **Telemetria presa à visão**, centralizada no topo, sempre por cima das janelas: `src/ui/telemetry-hud-system.ts`.
- **Convenção de estados dos dispositivos** (cor + ícone, definida pelo usuário): fechadura trancada = cadeado vermelho, destrancada = cadeado aberto verde; AC = floco de neve azul (desligado em cinza, proposta). Documento: `docs/ux/DEVICE_CONVENTION.md`; planilha de acompanhamento: https://claude.ai/artifact/GW6KU3KYj1PZGH8RzKs9Hh; código: `src/devices/device-convention.ts`.
- **Cursor do raio mais suave**, com rastro em degradê ciano → âmbar no snap: `src/input/hand-ray-cursor.ts`.
- **Configurações › Devices:** "Return tags to HUD" (devolve os tags virtuais ao HUD) e "Restart app" (volta ao estado inicial, com confirmação em dois toques): `src/ui/settings-panel-system.ts`.
- **Guia do usuário em PDF** e **página de entrada** (antes do app: explica e pede a câmera fora do AR, links para os tags e o guia, EN/pt-BR). Só no aura-dev, sem commit. Arquivos: `index.html`, `public/guide/`, `tools/generate-user-guide.py`.
- **Histórico do git limpo:** um download incompleto de 91 MB foi removido do histórico (force push autorizado pelo usuário).

## 4. O que está pronto e testado

| Teste | Onde | Resultado | Data |
|---|---|---|---|
| Typecheck e 22 testes unitários (detector, tabela de tags, cálculo da posição, reset, convenção) | PC | Passam | 2026-11-18 |
| Round-trip da âncora (ícones simulados) | Quest 3S e emulador | Passou (relatado pelo usuário) | 2026-11-17 |
| Câmera dentro do AR (1280x960, 3 câmeras, com "Headset cameras") | Quest 3S | Funciona (relatado pelo usuário) | 2026-11-17 |
| Leitura do tag impresso (00a lido como tag 10, TV) | Quest 3S | Funciona (relatado pelo usuário) | 2026-11-17 |
| Janela aberta na frente do tag físico (lâmpada, AC, TV), virada para o usuário | Quest 3S | Funciona, posição aproximada (relatado pelo usuário) | 2026-11-17 |
| Correção de altura do tag virtual (4°), fim do sumiço a ~1,2 m, pinch no tag virtual | — | **Não verificado** no Quest | — |
| Rastro do cursor, cores da convenção, Restart app, Return tags to HUD | — | **Não verificado** no Quest | — |
| Página de entrada ("Allow camera") | — | **Não verificado** no Quest | — |

## 5. Identidade visual (para a landing page)

Fonte única: `docs/ux/VISUAL_ID.md`. Regra: **ciano = repouso** (disponível, desligado, informação); **âmbar = ativo** (ligado, selecionado, confirmando); a transição é um degradê ciano → âmbar.

| Token | Hex | Uso |
|---|---|---|
| `bg-deep` | `#1b2e3f` | superfície das janelas e barras |
| `bg-canvas` | `#253544` | fundo de página |
| `surface-raised` | `#2f4052` | botões secundários, trilhos |
| `surface-glass` | `#466077` | realce do vidro |
| `border-glass` | `#4e7089` | borda fina de janelas e barras |
| `cyan` | `#62e2ef` | repouso: ícones, contornos, cursor |
| `cyan-dim` | `#478091` | linhas secundárias, wireframe |
| `amber` | `#ffb850` | ativo: botão primário, ligado |
| `text` | `#e9f2f9` | texto principal |
| `text-muted` | `#8fb3c4` | texto secundário |
| `text-on-amber` | `#14222e` | texto sobre âmbar |
| `danger` | `#ff8a80` | só confirmações destrutivas |

Cores de estado dos dispositivos (convenção): vermelho `#ff5a5f`, verde `#3ddc84`, azul `#4aa8ff`, laranja `#ff9f43`, off-white `#b8c4cc`, cinza `#6b7c8a`. Fonte: Inter. A página de entrada usa outro estilo de propósito: claro, azul Meta (`#0082fb`), o mesmo do guia ilustrado (`docs/ux/ux-illustrated-guide/`).

## 6. Decisões tomadas (novas)

- **Ler o tag pela câmera do navegador (getUserMedia), não pelo passthrough:** a página não recebe os pixels do passthrough que o usuário vê; a câmera do headset, com permissão, sim.
- **Dicionário próprio com os 12 tags impressos:** a numeração do `js-aruco2` não bate com a do gerador usado no PDF.
- **Posição pela imagem + pose da cabeça** (modelo pinhole, tamanho do tag 112 mm), com correção de 4° na inclinação da câmera; sem profundidade do ambiente por enquanto.
- **Sem API com aparelhos reais:** estados simulados, experiência profissional; Matter fica para a Phase 5.
- **Pedir a câmera antes do AR** (página de entrada): dentro da sessão imersiva, o pedido do navegador pode ficar escondido.
- **O texto do Devpost é da Lola**; este repositório só passa o estado.

## 7. Bloqueios e pendências

- **Prazo da submissão:** quarta, 18/nov/2026, 12:00 PT. Depois do prazo, o app publicado não pode mudar até o resultado.
- **Página de entrada e guia na produção:** esperando o teste do usuário no aura-dev e o "sim" dele.
- **Phase 3 ainda não congelada** (sem tag `phase-3` nem endereço próprio).
- **Convenção:** lâmpada, TV e AC desligado são propostas, ainda não confirmadas pelo usuário.
- **README e guia inicial em PT:** ainda não cobrem a Phase 3.

## 8. Próximos passos

1. O usuário testa a produção e o aura-dev no Quest.
2. Publicar a página de entrada e o guia (`npm run deploy`), se aprovados.
3. Lola: texto do Devpost com o aviso da câmera (seção 2); o usuário grava o vídeo com o guia como roteiro; submeter.
4. Depois: salvar a posição dos tags lidos, scanner contínuo sem janela, congelar a Phase 3.

## 9. Arquivos principais

| Caminho | O que é |
|---|---|
| `iwsdk.config.json` | Configuração do projeto IWSDK (AR, câmera, recursos de XR) |
| `index.html` | Página de entrada (antes do app) |
| `src/camera/tag-scanner-system.ts` | Scanner: câmera, leitura e abertura do dispositivo |
| `src/markers/` | Detector de AprilTag, tabela tag → dispositivo, posição no mundo |
| `src/devices/` | Registro dos dispositivos, convenção de estados, nomes e textos |
| `src/anchors/` | Âncora persistente |
| `src/ui/` | Sistemas de interface: janelas, HUD, telemetria, configurações |
| `src/input/hand-ray-cursor.ts` | Cursor do raio com snap e rastro |
| `public/ui/*.uikitml` | Painéis: janelas, scanner, tags, configurações, telemetria |
| `public/guide/` | Guia do usuário, tags para imprimir, imagem da página de entrada |
| `tests/unit.test.ts` | Testes unitários (22) |
| `tools/` | Geradores (tags, guias, PDFs da submissão) e deploys |
| `docs/ux/VISUAL_ID.md`, `docs/ux/DEVICE_CONVENTION.md` | Identidade visual e convenção de estados |
| `docs/submission/` | Roteiro do vídeo e rascunho do Devpost (PDF) |
| `docs/dev-notes/` | Notas de sessão: PROGRESS, RESUME, logs |

---

## Histórico de versões deste status

- **2026-11-18, quarta versão** — Phase 3 na produção (câmera lê os tags impressos, tags virtuais, janelas na frente do tag, TV = tag 10); nova identidade visual (tokens); convenção de estados; Restart app; guia do usuário em PDF e página de entrada (só no aura-dev); aviso da câmera para o Devpost e o vídeo.
- **2026-11-17, terceira versão** — Fases congeladas por tag (Phase 1 e Phase 2, cada uma no próprio endereço) e menu Project phases no app; marcos definidos até a Phase 5; termos "Phase" em inglês; marcadores guardados em `docs/apriltag/`, impressos e colados no cômodo; produção ainda na Phase 1.
- **2026-11-17, segunda versão** — Commit `c22daaa` com todo o trabalho pendente; cursor e pinch verificados no Quest; som novo; rascunho do Devpost com Visão, enquadramento de MVP e troca de stack; README com a hospedagem correta.
- **2026-11-17** — Primeira versão (linha de base). Phase 1 publicada e marcada; interface estilo Quest, HUD, Configurações em 6 seções e i18n em 5 idiomas no aura-dev, ainda sem commit.
