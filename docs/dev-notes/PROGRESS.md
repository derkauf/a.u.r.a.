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
| **Acesso pelo Quest e celular na Wi-Fi** | A página abre (confirmado pelo usuário), com certificado próprio para a LAN (`npm run cert:lan`). **Não verificado:** passthrough depois de **Enter XR**; o usuário relatou cena estática. |
| **Round-trip da âncora** | Não verificado: a sessão XR no emulador e no Quest ainda não rodou para esse teste. |

## Próximos (em ordem)

1. **Passthrough no Quest:** abrir `https://192.168.1.218:8081/`, tocar em **Enter XR** e confirmar a sessão AR.
2. **Rodar o round-trip da âncora** no emulador (IWER, perfil Quest 3), seguindo `tests/anchor-roundtrip.md`.
3. **Itens não verificados do build inicial:**
   - o `display: none` do painel com raycast;
   - o clique no sticker fora do botão "Scan tag".
4. **O mesmo teste no Meta Quest 3S.**
5. **Decidir se comentários e docs também vão para o inglês.**
6. **Atualizar o README e o guia em PDF** (idioma, Settings, `cert:lan`); veja a seção 6 do log de 17/11.
7. **Comparar com `derkauf/a.u.r.a.`** e anotar as diferenças.

## Esperando

| Item | Esperando |
|---|---|
| Teste no Quest pelo cabo (`adb reverse`, skill `iwsdk-native-xr-test`) | Cabo USB-C de dados novo (o atual está quebrado) |

## Mudanças recentes

Da mais nova para a mais antiga, no máximo umas 10 linhas. As mais antigas vão para `changelog/AAAA-MM.md`.

| Data | Mudança | Detalhes |
|---|---|---|
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
| Teste da âncora | `tests/anchor-roundtrip.md` |
| Especificação do painel | `docs/ux/device-panel-spec.md` |
| AprilTags imprimíveis | `docs/apriltag-markers.md` |
