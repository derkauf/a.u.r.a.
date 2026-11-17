# Progresso: A.U.R.A. v1 (paralela, por Lola)

O arquivo para ler no início de cada sessão: para onde o projeto vai, o que está em andamento, o que vem depois e o que está esperando. O resto é linkado daqui.

## Objetivo

Uma segunda implementação da v1 do A.U.R.A. (Ambient User Responsive Automation), feita a partir da mesma documentação, para comparar com o repo oficial `derkauf/a.u.r.a.`, que continua sendo a fonte de verdade. O loop da v1 é: **AprilTag na parede → âncora espacial persistente → painel do dispositivo → cursor de raio da mão com snap magnético.** São um cômodo e três dispositivos simulados (lâmpada, ar-condicionado e fechadura), sem chamada de IA. A v1 está pronta quando o round-trip da âncora (`tests/anchor-roundtrip.md`) passar no emulador e no Quest 3S.

## Agora

**Voltando? Rode `/retomar` (ou `/resume`), ou leia [RESUME.md](RESUME.md).**

| Tarefa | Estado |
|---|---|
| **Critério de pronto da v1: round-trip da âncora** | **Passou no Quest 3S e no emulador** (relatado pelo usuário em 17/11): depois de refresh e de fechar e reabrir, os painéis voltaram no mesmo lugar com "Âncora: ativa (restaurada)", e os valores persistiram. |
| **Endereços publicados (Vercel, escopo `derkaufs-projects`)** | Produção para os juízes, **ainda na Phase 1**: https://aura.sixvectors.app/ (`npm run deploy`). Phase 1 congelada: https://aura-phase1.sixvectors.app/. Phase 2 congelada: https://aura-phase2.sixvectors.app/. Dev: https://aura-dev.sixvectors.app/ (`npm run deploy:dev`, hoje igual à Phase 2). Sem ligação com o GitHub: um push não publica nada. Todo deploy sai de uma cópia sem `.git` (no plano Hobby, a Vercel recusa o autor do commit). |
| **Project phases** | Cada fase é congelada numa tag do git e publicada sem mudanças com `npm run deploy:phase -- phase-N` (usa o código da tag, nunca o diretório de trabalho). O app lista as fases em Configurações › Project phases ([`src/phases/phases.ts`](../../src/phases/phases.ts)). **Phase 1** (tag `phase-1`, `dc82aa3`): tags simulados, janelas, âncora, EN/pt-BR. **Phase 2** (tag `phase-2`, `86ff8b4`): HUD estilo Quest com "Follow my view", Configurações em 7 seções, pinch confiável (verificado no Quest), 5 idiomas. **Phase 3** (próxima, não iniciada): leitura real dos AprilTags pela câmera. **Phase 4:** Deeper Mode, temas, áudio espacial, importar JSON. **Phase 5:** dispositivos reais via Matter. |
| **Material da submissão** | [`docs/submission/`](../submission/): roteiro do vídeo e rascunho do Devpost (com Vision, MVP e a frase da troca de stack), gerados por `tools/generate-submission-pdfs.py`. O "What it does" ainda descreve a Phase 1. |
| **Marcadores para imprimir** | [`docs/apriltag/`](../apriltag/): PDF `tag36h11` IDs 1–12, ~112 mm; o A.U.R.A. usa os IDs 1, 2 e 3. |

## Próximos (em ordem)

1. **Decidir a fase da produção dos juízes** (Phase 2 ou Phase 3) e publicar com `npm run deploy` antes de 18/nov/2026, 12:00 PT (prazo em `../CONTEXT.md`). Testar o link no Quest.
2. **Phase 3: leitura dos AprilTags pela câmera.** Primeiro, verificar se o navegador do Quest libera a câmera dentro da sessão XR (`features.camera` do IWSDK; detector `js-aruco2` com o dicionário `APRILTAG_36h11`; âncora pelo hit-test). Quando concluída: `CURRENT_PHASE = 'phase-3'`, tag `phase-3`, `npm run deploy:phase -- phase-3`.
3. **Submissão:** atualizar o "What it does" do Devpost para a versão publicada, gravar o vídeo (`docs/submission/aura-roteiro-video.pdf`) e submeter.
4. **Atualizar [`docs/STATUS_PARA_LOLA.md`](../STATUS_PARA_LOLA.md)** com as fases congeladas.
5. **Atalho do A.U.R.A. no quick menu do Quest** (referência: `docs/ux/quest-reference/29223598017272509.jpg`).
6. **Atualizar o README e o guia em PDF** (ver a seção 6 da Parte 4 do log de 17/11).
7. **Não verificado:** os limites do HUD depois do ajuste (50°/40°), o alcance de ativação, exportar JSON no Quest, o "Abrir" de uma fase dentro do XR.

## Esperando

| Item | Esperando |
|---|---|
| Teste da Phase 3 com os tags impressos | O usuário imprimir os tags (FedEx Office, papel fosco de 200 g) ou abrir um tag no outro monitor |
| Controle do Quest pelo CLI (`adb reverse`, skill `iwsdk-native-xr-test`); opcional, a Wi-Fi já funciona | O Quest aparece como "unauthorized": aceitar a depuração USB dentro do headset (Desenvolvedor › revogar autorizações, reconectar, "Sempre permitir"). O `OVRService` (Link) está parado no PC até reiniciá-lo |

## Mudanças recentes

Da mais nova para a mais antiga, no máximo umas 10 linhas. As mais antigas vão para `changelog/AAAA-MM.md`.

| Data | Mudança | Detalhes |
|---|---|---|
| 2026-11-17 | **Phase 2 congelada; Phase 1 e Phase 2 publicadas em endereços próprios.** HUD estilo Quest, Configurações em 7 seções, pinch confiável (verificado no Quest), i18n em 5 idiomas, menu Project phases, marcadores para impressão, rascunho do Devpost com Vision/MVP/troca de stack | [chat-logs/2026-11-17-instalacao-dev-notes.md](chat-logs/2026-11-17-instalacao-dev-notes.md) (Parte 4) |
| 2026-11-17 | **Round-trip da âncora passou no Quest e no PC: critério de pronto da v1 cumprido.** Repo criado em `derkauf/aura-v1-lola` (privado) | [chat-logs/2026-11-17-instalacao-dev-notes.md](chat-logs/2026-11-17-instalacao-dev-notes.md) (Parte 3) |
| 2026-11-17 | **Primeira execução, fonte com acentos, inglês + pt-BR, certificado LAN.** UI renomeada de `*.uikitml.html`; Inter via `TTFLoader`; painel Settings; `npm run cert:lan` | [chat-logs/2026-11-17-instalacao-dev-notes.md](chat-logs/2026-11-17-instalacao-dev-notes.md) (Parte 2) |
| 2026-11-17 | **Metodologia de sessão instalada.** `docs/dev-notes/` (PROGRESS, RESUME, chat-logs, changelog, template), e as regras de sessão no `CLAUDE.md` | [chat-logs/2026-11-17-instalacao-dev-notes.md](chat-logs/2026-11-17-instalacao-dev-notes.md) |
| 2026-11-14 | **Build inicial da v1 paralela:** scaffold IWSDK 1.1.0, 3 dispositivos, 3 sistemas, 12 testes unitários | [`memory.md`](../../memory.md) |

## Onde as coisas ficam

| O quê | Onde |
|---|---|
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
