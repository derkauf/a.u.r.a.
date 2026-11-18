# Progresso: A.U.R.A. v1 (paralela, por Lola)

O arquivo para ler no início de cada sessão: para onde o projeto vai, o que está em andamento, o que vem depois e o que está esperando. O resto é linkado daqui.

## Objetivo

Uma segunda implementação da v1 do A.U.R.A. (Ambient User Responsive Automation), feita a partir da mesma documentação, para comparar com o repo oficial `derkauf/a.u.r.a.`, que continua sendo a fonte de verdade. O loop da v1 é: **AprilTag na parede → âncora espacial persistente → painel do dispositivo → cursor de raio da mão com snap magnético.** São um cômodo e três dispositivos simulados (lâmpada, ar-condicionado e fechadura), sem chamada de IA. A v1 está pronta quando o round-trip da âncora (`tests/anchor-roundtrip.md`) passar no emulador e no Quest 3S.

## Agora

**Voltando? Rode `/retomar` (ou `/resume`), ou leia [RESUME.md](RESUME.md).**

| Tarefa | Estado |
|---|---|
| **Critério de pronto da v1: round-trip da âncora** | **Passou no Quest 3S e no emulador** (relatado pelo usuário em 17/11): depois de refresh e de fechar e reabrir, os painéis voltaram no mesmo lugar com "Âncora: ativa (restaurada)", e os valores persistiram. |
| **CONGELAMENTO da produção (18/11, 12:00 PT)** | **Regra super importante, também no `CLAUDE.md`.** O `aura.sixvectors.app` sai do CLI da Vercel, não do GitHub. Depois do prazo, nada mais é publicado nele até o resultado. O `tools/deploy-vercel.mjs` recusa a produção depois de 18/11 20:00 UTC. Antes disso, só publica uma árvore limpa e com commit, e manda o mesmo commit para o repositório oficial. Decisão do usuário (18/11): congela o que estiver no ar ao meio-dia. Até lá, trabalhamos no `aura-next` e só subimos para a produção se der tempo. |
| **Repositórios (18/11)** | **`derkauf/a.u.r.a.`** (oficial, agora **público**): o registro exato do que está no ar. `main` = `6768fea` (Phase 3 publicada), mais as tags `phase-1` e `phase-2`; remote `official` aqui. **`derkauf/aura-next`**: este repositório, renomeado de `aura-v1-lola`; é o ambiente de desenvolvimento, publicado em https://aura-next.sixvectors.app/ (`npm run deploy:dev`; o `aura-dev` continua respondendo). **`derkauf/aura-landing`**: a landing page. **A pasta local ainda se chama `aura-v1-lola-paralela`:** o usuário renomeia para `aura-next` depois do próximo `/devlog`, com o VS Code fechado, e reabre com `/resume`. |
| **Endereços publicados (Vercel, escopo `derkaufs-projects`)** | Produção para os juízes, **Phase 3 desde 17/11** (commit `6768fea`: scanner pela câmera, tags virtuais sobre os papéis, convenção de estados): https://aura.sixvectors.app/ (`npm run deploy`). Phase 1 congelada: https://aura-phase1.sixvectors.app/. Phase 2 congelada: https://aura-phase2.sixvectors.app/. Dev: https://aura-dev.sixvectors.app/ (`npm run deploy:dev`, hoje igual à Phase 2). Sem ligação com o GitHub: um push não publica nada. Todo deploy sai de uma cópia sem `.git` (no plano Hobby, a Vercel recusa o autor do commit). |
| **Project phases** | Cada fase é congelada numa tag do git e publicada sem mudanças com `npm run deploy:phase -- phase-N` (usa o código da tag, nunca o diretório de trabalho). O app lista as fases em Configurações › Project phases ([`src/phases/phases.ts`](../../src/phases/phases.ts)). **Phase 1** (tag `phase-1`, `dc82aa3`): tags simulados, janelas, âncora, EN/pt-BR. **Phase 2** (tag `phase-2`, `86ff8b4`): HUD estilo Quest com "Follow my view", Configurações em 7 seções, pinch confiável (verificado no Quest), 5 idiomas. **Phase 3** (em andamento desde 17/11, `CURRENT_PHASE = 'phase-3'`): nova identidade visual aplicada ao app (tokens em [`docs/ux/VISUAL_ID.md`](../ux/VISUAL_ID.md): ciano = repouso, âmbar = ativo); etapa 1, **scanner de tags** (botão de scan ao lado da engrenagem › janela "Tag scanner"; [`src/camera/tag-scanner-system.ts`](../../src/camera/tag-scanner-system.ts), `features.camera`): testa se a página recebe as imagens da câmera dentro do AR (o passthrough visível já fica sempre ligado, mas os pixels não chegam à página sem a Passthrough Camera API). Não confundir com o "View camera" da fechadura, que é a câmera da porta (simulada). **Câmera confirmada no Quest** (1280x960, 3 câmeras, com "Headset cameras" liberado). Detector de AprilTag pronto ([`src/markers/apriltag-detector.ts`](../../src/markers/apriltag-detector.ts), js-aruco2 com dicionário dos 12 tags impressos; testes leem 1, 2 e 12): a janela mostra o tag lido, o dispositivo e o brilho da imagem; **leitura confirmada no Quest** (tag 00a lido como "Tag 10", 17/11). Ler um tag cadastrado agora vincula o dispositivo e abre a janela dele (`src/markers/scan-bus.ts`). Dispositivo de teste novo: **TV da sala = tag 10 (00a)**, liga/desliga e volume, só pela câmera (sem ícone no HUD e ainda fora de Configurações › Dispositivos). A janela do dispositivo lido abre **na frente do tag físico**, no mundo ([`src/markers/tag-placement.ts`](../../src/markers/tag-placement.ts); posição pela imagem + pose da cabeça); **confirmado no Quest** (17/11); rastreamento suavizado (zona morta + easing). Telemetria presa à visão, no topo, por cima das janelas. Tag virtual (o código real do tag impresso) desenhado sobre o papel e clicável; janela 24 cm acima; tudo sempre de frente para o usuário. **Verificação no Quest pendente.** Depois: cartão do dispositivo ancorado sobre o tag, no estilo do vídeo de referência `aura-snap-specs-ac-ar-demo-2026-10-11.mp4` (estados simulados, sem API com aparelhos reais), e scanner contínuo sem janela. **Phase 4:** Deeper Mode, temas, áudio espacial, importar JSON. **Phase 5:** dispositivos reais via Matter. |
| **Material da submissão** | [`docs/submission/`](../submission/): roteiro do vídeo e rascunho do Devpost (com Vision, MVP e a frase da troca de stack), gerados por `tools/generate-submission-pdfs.py`. O "What it does" ainda descreve a Phase 1. |
| **Marcadores** | [`docs/apriltag/`](../apriltag/): PDF `tag36h11` IDs 1–12, ~112 mm; o A.U.R.A. usa os IDs 1, 2 e 3. **Impressos e colados no cômodo (paredes e porta), relatado pelo usuário em 17/11**; lado real ainda não medido. |

## Próximos (em ordem)

1. **Testar a produção no Quest** (https://aura.sixvectors.app/, Phase 3, publicada em 17/11): liberar "Headset cameras", escanear os tags, round-trip da âncora. Depois, submeter no Devpost antes de 18/nov/2026, 12:00 PT (prazo em `../CONTEXT.md`).
1. **Página de entrada e guia do usuário:** testar no Quest em https://aura-dev.sixvectors.app/ (botão "Allow camera" com Headset cameras); se aprovados, `npm run deploy` e commit. O guia sai de `tools/generate-user-guide.py`.
2. **Phase 3, polimento:** testar no Quest a correção de 4°, o fim do sumiço a ~1,2 m e o toque no tag virtual; profundidade pelo hit-test na parede; scanner contínuo sem janela; salvar a posição dos tags na âncora persistente; TV em Configurações. Depois: tag `phase-3` e `npm run deploy:phase -- phase-3`.
3. **Submissão:** o texto do Devpost é feito pela Lola, assistente do usuário (informado em 18/11), e não sai mais daqui. Aqui só cabe passar a ela o que mudou (ver item 4). Falta gravar o vídeo (`docs/submission/aura-roteiro-video.pdf`, guia em `docs/guide/`) e submeter.
3. **Landing page (feita pelo usuário e pela Lola):** repositório próprio `derkauf/aura-landing` (privado, criado em 18/11; pasta local `../aura-landing`, ao lado deste projeto), em `aura-home.sixvectors.app`, com projeto próprio na Vercel e deploy pelo CLI. Fica fora deste repositório para que ajustes nela não republiquem o app congelado dos juízes. **No ar desde 18/11:** https://aura-home.sixvectors.app/ (export do Muse; mídia tirada de dentro do `index.html`, de 39 MB para 205 KB; deploy com `node tools/deploy.mjs`; como atualizar está no README de lá). Onboarding (`#before-you-enter`) corrigido pela página de referência `a-u-r-a-landing-page-concept-2.html` (commit `fb999a4`); **conferido no ar pelo usuário em 18/11**. O "Enter VR" da faixa âmbar virou um botão que rola até o "Enter A.U.R.A." (`67ac713`); **testado no Quest pelo usuário**.
4. **Atualizar [`docs/STATUS_PARA_LOLA.md`](../STATUS_PARA_LOLA.md)** com a Phase 3 e os tokens de [`docs/ux/VISUAL_ID.md`](../ux/VISUAL_ID.md) (para a landing page).
5. **Atalho do A.U.R.A. no quick menu do Quest** (referência: `docs/ux/quest-reference/29223598017272509.jpg`).
6. **Atualizar o README e o guia em PDF** (ver a seção 6 da Parte 4 do log de 17/11).
7. **Não verificado:** os limites do HUD depois do ajuste (50°/40°), o alcance de ativação, exportar JSON no Quest, o "Abrir" de uma fase dentro do XR.

## A revisar (pedido do usuário, 17/11)

- **Leitura pela câmera:** o juiz só consegue ler tags se tiver os tags impressos e liberar a câmera ("Headset cameras"). Sem isso, o app continua funcionando pelos ícones simulados do HUD, como na Phase 1. **Dizer isso no Devpost e no vídeo.**
- **Posição dos tags lidos:** fica só na memória da sessão; ao recarregar a página, é preciso escanear de novo. Salvar na âncora persistente.
- **Phase 3 no menu de fases:** ainda não congelada (sem tag `phase-3` nem endereço próprio). Congelar quando o usuário considerar a fase validada.

## Esperando

| Item | Esperando |
|---|---|
| Controle do Quest pelo CLI (`adb reverse`, skill `iwsdk-native-xr-test`); opcional, a Wi-Fi já funciona | O Quest aparece como "unauthorized": aceitar a depuração USB dentro do headset (Desenvolvedor › revogar autorizações, reconectar, "Sempre permitir"). O `OVRService` (Link) está parado no PC até reiniciá-lo |

## Mudanças recentes

Da mais nova para a mais antiga, no máximo umas 10 linhas. As mais antigas vão para `changelog/AAAA-MM.md`.

| Data | Mudança | Detalhes |
|---|---|---|
| 2026-11-17 | **Phase 3 na produção; guia do usuário em PDF e página de entrada** (guia 16:9 em `docs/guide/`, para o vídeo; página que pede a câmera fora do AR, só no aura-dev) | [chat-logs/2026-11-17-instalacao-dev-notes.md](chat-logs/2026-11-17-instalacao-dev-notes.md) (Parte 5) |
| 2026-11-17 | **Convenção de estados dos dispositivos aplicada; cursor com rastro; reiniciar o app.** Cor + ícone por estado (`docs/ux/DEVICE_CONVENTION.md`, planilha [A.U.R.A. Device Convention](https://claude.ai/artifact/GW6KU3KYj1PZGH8RzKs9Hh)); fechadura vermelho/verde, AC azul; cursor suave com rastro em degradê; Configurações › Devices: Return tags to HUD e Restart app | [chat-logs/2026-11-17-instalacao-dev-notes.md](chat-logs/2026-11-17-instalacao-dev-notes.md) (Parte 5) |
| 2026-11-17 | **Phase 3: a câmera do Quest lê os AprilTags impressos.** Nova identidade visual (tokens em `docs/ux/VISUAL_ID.md`); botão de scan e janela Tag scanner; detector com os 12 códigos impressos; TV = tag 10; tag cadastrado abre o dispositivo, com tag virtual sobre o papel e janela acima, de frente para o usuário. Histórico limpo (download de 91 MB removido, force push) | [chat-logs/2026-11-17-instalacao-dev-notes.md](chat-logs/2026-11-17-instalacao-dev-notes.md) (Parte 5) |
| 2026-11-17 | **Phase 2 congelada; Phase 1 e Phase 2 publicadas em endereços próprios.** HUD estilo Quest, Configurações em 7 seções, pinch confiável (verificado no Quest), i18n em 5 idiomas, menu Project phases, marcadores para impressão, rascunho do Devpost com Vision/MVP/troca de stack | [chat-logs/2026-11-17-instalacao-dev-notes.md](chat-logs/2026-11-17-instalacao-dev-notes.md) (Parte 4) |
| 2026-11-17 | **Round-trip da âncora passou no Quest e no PC: critério de pronto da v1 cumprido.** Repo criado em `derkauf/aura-v1-lola` (privado) | [chat-logs/2026-11-17-instalacao-dev-notes.md](chat-logs/2026-11-17-instalacao-dev-notes.md) (Parte 3) |
| 2026-11-17 | **Primeira execução, fonte com acentos, inglês + pt-BR, certificado LAN.** UI renomeada de `*.uikitml.html`; Inter via `TTFLoader`; painel Settings; `npm run cert:lan` | [chat-logs/2026-11-17-instalacao-dev-notes.md](chat-logs/2026-11-17-instalacao-dev-notes.md) (Parte 2) |
| 2026-11-17 | **Metodologia de sessão instalada.** `docs/dev-notes/` (PROGRESS, RESUME, chat-logs, changelog, template), e as regras de sessão no `CLAUDE.md` | [chat-logs/2026-11-17-instalacao-dev-notes.md](chat-logs/2026-11-17-instalacao-dev-notes.md) |
| 2026-11-14 | **Build inicial da v1 paralela:** scaffold IWSDK 1.1.0, 3 dispositivos, 3 sistemas, 12 testes unitários | [`memory.md`](../../memory.md) |

## Onde as coisas ficam

| O quê | Onde |
|---|---|
| Referências do usuário (identidade visual, vídeo do Devpost, UI, HUD, Quest, som) | [`docs/REFERENCES.md`](../REFERENCES.md); novidades com `npm run refs:check` |
| Logs de sessão (`/devlog`) | `chat-logs/` |
| Handoff (`/resume`) | `RESUME.md` |
| Template do log de sessão | `templates/DEVLOG_TEMPLATE.md` |
| Histórico mensal | `changelog/` |
| Log do build inicial (14/11) | [`memory.md`](../../memory.md), na raiz |
| Visão geral, comandos, arquitetura | [`README.md`](../../README.md) |
| Regras do IWSDK para agentes | [`AGENTS.md`](../../AGENTS.md), `.claude/rules/` |
| Textos da interface (en / pt-BR) | [`src/i18n/i18n.ts`](../../src/i18n/i18n.ts) |
| Certificado da LAN | `npm run cert:lan` → `.iwsdk/https-lan/` (git-ignorado) |
| Submissão: roteiro do vídeo e rascunho do Devpost | `docs/submission/` (PDFs gerados por `tools/generate-submission-pdfs.py`) |
| Teste da âncora | `tests/anchor-roundtrip.md` |
| Especificação do painel | `docs/ux/device-panel-spec.md` |
| AprilTags imprimíveis | `docs/apriltag-markers.md` |
