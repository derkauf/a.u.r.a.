# Retomar: A.U.R.A. v1 paralela (escrito em 2026-11-17)

Comece por aqui quando voltar. O `/devlog` (ou `/encerrar`) reescreve este arquivo no fim de cada sessão.

Este arquivo lista só **ações**. O **estado** (o que está pronto, travado ou esperando) fica em [PROGRESS.md](PROGRESS.md). Se os dois parecerem discordar, vale o PROGRESS.

## 0. Primeira checagem

- **Git:** rode `git status`. As dev notes atualizadas em 17/11 (Parte 3 do log) podem ainda não ter sido commitadas; pergunte ao usuário antes de commitar.
- **Esperando:** veja PROGRESS › Esperando e pergunte ao usuário se o item listado lá já chegou.
- **IP do PC:** rode `ipconfig` (ou `npx @iwsdk/cli dev status` e veja `runtimeUrls.network`). Se o IP mudou de `192.168.1.218`, rode `npm run cert:lan` antes de qualquer teste na Wi-Fi.

## 1. Ações pendentes, em ordem

| # | Arquivo / ação | Antes | O que faz |
|---|---|---|---|
| 1 | Comparar com `derkauf/a.u.r.a.` | Acesso ao repo oficial (`gh repo view derkauf/a.u.r.a.`) | Lista as diferenças entre as duas implementações da v1 (o próximo marco) |
| 2 | Os itens não verificados (PROGRESS › Próximos 2) | `npm run dev`; sessão XR no emulador | `display: none` com raycast |
| 3 | Perguntar se comentários e docs vão para o inglês | — | Fecha a decisão em aberto sobre o escopo da tradução |
| 4 | `README.md` e `tools/generate-guia-pdf.py` | A decisão da ação 3 | Atualiza o idioma, o painel Settings, o `cert:lan`, o `https://` e o round-trip como passado (veja a seção 6 das Partes 2 e 3 do log de 17/11) |
| 5 | Skill `iwsdk-native-xr-test` com `adb reverse` (opcional) | Cabo USB-C de dados; "Permitir depuração USB" no headset. O `adb` está em `%LOCALAPPDATA%\Android\Sdk\platform-tools\` | Controle do Quest pelo CLI (recarregar, poses, estado do ECS) |

## 2. Como verificar

- **Typecheck:** `npm run typecheck`, sem erros.
- **Testes unitários:** `npm run test:unit`, 12 de 12.
- **Build:** `npm run build`. O aviso de chunk acima de 500 kB é esperado.
- **Fonte:** `npx @iwsdk/cli browser logs --input-json '{"count":500}'` sem `Missing glyph`.
- **Idioma:** em XR emulado, aponte o controle direito para o botão do idioma (`xr look-at` + `xr select`; o painel Settings fica em `[0, 1.86, -0.6]`) e confira o texto com `ui inspect` no seletor `#txt-settings-title`. O botão não responde a toque direto (`press`) porque os painéis só têm `RayInteractable`.

## 3. O que testar

- **Regressão do round-trip** (se mexer em âncora, painéis ou registro): leia os 3 tags, altere valores, feche e reabra. Os painéis voltam no mesmo lugar com "Anchor: active (restored)" e os valores persistem.
- **Idioma:** troque para Português (BR) e recarregue; tudo continua em português.
- **Log:** os eventos da âncora ficam em `localStorage`, na chave `aura_anchor_test_log`.

## 4. Próximo marco

- A comparação com `derkauf/a.u.r.a.` (ação 1).

## 5. Esperando outros

- Veja PROGRESS › Esperando.

## 6. Outras pendências

- Nos 3 stickers, o nome do dispositivo quase não aparece (texto escuro sobre a superfície escura do `<Panel>` do Horizon). Já era assim antes; corrigir só se o usuário pedir.
- `npm audit` relata 3 vulnerabilidades altas; os scripts de instalação de `onnxruntime-node`, `protobufjs` e `@meta-quest/metavr` seguem bloqueados. Não tratar sem perguntar.
- O `memory.md` da raiz é o log do build inicial. Daqui em diante, os logs de sessão vão para `docs/dev-notes/chat-logs/`.

## Arquivos de referência

- Estado: [PROGRESS.md](PROGRESS.md)
- Última sessão: [chat-logs/2026-11-17-instalacao-dev-notes.md](chat-logs/2026-11-17-instalacao-dev-notes.md) (Partes 2 e 3)
- Repositório: https://github.com/derkauf/aura-v1-lola (privado)
- Textos da interface: [`src/i18n/i18n.ts`](../../src/i18n/i18n.ts)
- Fonte dos painéis: [`src/ui/aura-font.ts`](../../src/ui/aura-font.ts)
- Certificado da LAN: [`tools/generate-lan-cert.mjs`](../../tools/generate-lan-cert.mjs)
- Build inicial: [`memory.md`](../../memory.md)
- Visão geral e comandos: [`README.md`](../../README.md)
- Teste da âncora: `tests/anchor-roundtrip.md`
