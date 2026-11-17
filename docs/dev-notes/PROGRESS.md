# Progresso: A.U.R.A. v1 (paralela, por Lola)

O arquivo para ler no início de cada sessão: para onde o projeto vai, o que está em andamento, o que vem depois e o que está esperando. O resto é linkado daqui.

## Objetivo

Uma segunda implementação da v1 do A.U.R.A. (Ambient User Responsive Automation), feita a partir da mesma documentação, para comparar com o repo oficial `derkauf/a.u.r.a.`, que continua sendo a fonte de verdade. O loop da v1 é: **AprilTag na parede → âncora espacial persistente → painel do dispositivo → cursor de raio da mão com snap magnético.** São um cômodo e três dispositivos simulados (lâmpada, ar-condicionado e fechadura), sem chamada de IA. A v1 está pronta quando o round-trip da âncora (`tests/anchor-roundtrip.md`) passar no emulador e no Quest 3S.

## Agora

**Voltando? Rode `/retomar` (ou `/resume`), ou leia [RESUME.md](RESUME.md).**

| Tarefa | Estado |
|---|---|
| **Build inicial (14/11)** | Feito e verificado: typecheck limpo, 12 de 12 testes unitários, build e dev server. Detalhes em [`memory.md`](../../memory.md). |
| **Primeira execução nesta máquina (16–17/11)** | Feito e verificado no emulador. Os 7 arquivos de UI vieram do Drive como `*.uikitml.html` e foram renomeados. Typecheck, 12 de 12 testes e build passam em 17/11. |
| **Fonte com acentos** | Feito e verificado no emulador: Inter com charset latino gerada em código ([`src/ui/aura-font.ts`](../../src/ui/aura-font.ts)); 0 avisos `Missing glyph`. |
| **Interface em inglês + seletor pt-BR** | Feito e verificado no emulador: painel Settings acima dos stickers; troca nos dois sentidos com o raio do controle; a escolha persiste no reload. Só os textos da interface; comentários e docs seguem em português (decisão em aberto). |
| **Acesso pelo Quest e celular na Wi-Fi** | Funciona, com certificado próprio para a LAN (`npm run cert:lan`). A sessão XR no Quest abre (o round-trip abaixo rodou nela). |
| **Publicado em https://aura.sixvectors.app/** | Vercel, projeto `aura-v1-lola` (escopo `derkaufs-projects`); certificado Let's Encrypt válido; página e bundle respondem 200; sem o emulador IWER no build. **Não testado no Quest pelo link público ainda.** Redeploy: `npm run deploy` (faz o deploy de uma cópia sem `.git`: dentro do repositório, a Vercel recusa o deploy porque o autor do commit não corresponde a uma conta Vercel no plano Hobby). |
| **Round-trip da âncora: critério de pronto da v1** | **Passou no Quest e no PC (emulador)**, relatado pelo usuário em 17/11: depois de refresh e de fechar e reabrir o app, os painéis voltaram no mesmo lugar com "Âncora: ativa (restaurada)", e os valores alterados persistiram. |

## Próximos (em ordem)

1. **Preparar a submissão do Meta VR Start** (prazo: quarta, 18/nov/2026, 12:00 PT; ver `../CONTEXT.md`): link público para os juízes, vídeo demo de menos de 3 min e a página do Devpost. **Decidido em 17/nov:** a comparação com `derkauf/a.u.r.a.` saiu do plano por falta de tempo; o trabalho segue neste repositório, e o oficial fica como fonte de ideias.
2. **Item não verificado do build inicial:** o `display: none` do painel com raycast. (O clique fora do botão deixou de existir em 17/nov: só o botão com o nome do dispositivo responde.)
3. **Decidir se comentários e docs também vão para o inglês.**
4. **Atualizar o README e o guia em PDF** (idioma, Settings, `cert:lan`, e o round-trip como passado); veja a seção 6 do log de 17/11.

## Esperando

| Item | Esperando |
|---|---|
| Controle do Quest pelo CLI (`adb reverse`, skill `iwsdk-native-xr-test`); opcional, o teste manual pela Wi-Fi já funciona | Cabo USB-C de dados novo (o atual está quebrado) |

## Mudanças recentes

Da mais nova para a mais antiga, no máximo umas 10 linhas. As mais antigas vão para `changelog/AAAA-MM.md`.

| Data | Mudança | Detalhes |
|---|---|---|
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
