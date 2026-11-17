# Retomar: A.U.R.A. v1 paralela (escrito em 2026-11-17)

Comece por aqui quando voltar. O `/devlog` (ou `/encerrar`) reescreve este arquivo no fim de cada sessão.

Este arquivo lista só **ações**. O **estado** (o que está pronto, travado ou esperando) fica em [PROGRESS.md](PROGRESS.md). Se os dois parecerem discordar, vale o PROGRESS.

## 0. Primeira checagem

- **Esperando:** veja PROGRESS › Esperando. Pergunte ao usuário se o item listado lá já chegou; se sim, a ação 2 abaixo fica liberada.
- **Passthrough:** pergunte ao usuário se ele tocou em **Enter XR** no Quest e o que aconteceu (veja PROGRESS › Agora, linha do acesso pelo Quest).
- **IP do PC:** rode `ipconfig` (ou `npx @iwsdk/cli dev status` e veja `runtimeUrls.network`). Se o IP mudou de `192.168.1.218`, rode `npm run cert:lan` antes de qualquer teste na Wi-Fi.

## 1. Ações pendentes, em ordem

| # | Arquivo / ação | Antes | O que faz |
|---|---|---|---|
| 1 | No Quest: `https://<ip-do-pc>:8081/` → **Advanced → Proceed** → **Enter XR** | `npm run dev`; `npm run cert:lan` se o IP mudou | Confirma a sessão AR com passthrough no headset |
| 2 | Skill `iwsdk-native-xr-test` com `adb reverse` | Cabo USB-C de dados; modo desenvolvedor; "Permitir depuração USB" no headset. O `adb` está em `%LOCALAPPDATA%\Android\Sdk\platform-tools\` | Controle do Quest pelo CLI (recarregar, poses, estado do ECS) |
| 3 | `npm run dev`, e depois `tests/anchor-roundtrip.md` | Perfil Quest 3 no IWER (já configurado) | O round-trip da âncora no emulador |
| 4 | Os itens não verificados (PROGRESS › Próximos 3) | Sessão XR aberta | `display: none` com raycast; clique fora do "Scan tag" |
| 5 | Perguntar se comentários e docs vão para o inglês | — | Fecha a decisão em aberto sobre o escopo da tradução |
| 6 | `README.md` e `tools/generate-guia-pdf.py` | A decisão da ação 5 | Atualiza o idioma, o painel Settings, o `cert:lan` e o `https://` (veja a seção 6 do log de 17/11, Parte 2) |

## 2. Como verificar

- **Typecheck:** `npm run typecheck`, sem erros.
- **Testes unitários:** `npm run test:unit`, 12 de 12.
- **Build:** `npm run build`. O aviso de chunk acima de 500 kB é esperado.
- **Fonte:** `npx @iwsdk/cli browser logs --input-json '{"count":500}'` sem `Missing glyph`.
- **Idioma:** em XR emulado, aponte o controle direito para o botão do idioma (`xr look-at` + `xr select`; o painel Settings fica em `[0, 1.86, -0.6]`) e confira o texto com `ui inspect` no seletor `#txt-settings-title`. O botão não responde a toque direto (`press`) porque os painéis só têm `RayInteractable`.

## 3. O que testar

- **Sessão 1:** leia os 3 tags ("Scan tag" em cada sticker). Os 3 painéis aparecem, cada um com "Anchor: active".
- **Sessão 2:** entre de novo sem tocar nos stickers. Os painéis estão no mesmo lugar, com "Anchor: active (restored)".
- **Valores:** a temperatura e o brilho persistem entre as sessões.
- **Idioma:** troque para Português (BR) e recarregue; tudo continua em português.
- **Log:** os eventos da âncora ficam em `localStorage`, na chave `aura_anchor_test_log`.

## 4. Próximo marco

- Depois do round-trip passar no emulador e no Quest, comparar com `derkauf/a.u.r.a.`.

## 5. Esperando outros

- Veja PROGRESS › Esperando.

## 6. Outras pendências

- Nos 3 stickers, o nome do dispositivo quase não aparece (texto escuro sobre a superfície escura do `<Panel>` do Horizon). Já era assim antes; corrigir só se o usuário pedir.
- `npm audit` relata 3 vulnerabilidades altas; os scripts de instalação de `onnxruntime-node`, `protobufjs` e `@meta-quest/metavr` seguem bloqueados. Não tratar sem perguntar.
- O `memory.md` da raiz é o log do build inicial. Daqui em diante, os logs de sessão vão para `docs/dev-notes/chat-logs/`.

## Arquivos de referência

- Estado: [PROGRESS.md](PROGRESS.md)
- Última sessão: [chat-logs/2026-11-17-instalacao-dev-notes.md](chat-logs/2026-11-17-instalacao-dev-notes.md) (Parte 2)
- Textos da interface: [`src/i18n/i18n.ts`](../../src/i18n/i18n.ts)
- Fonte dos painéis: [`src/ui/aura-font.ts`](../../src/ui/aura-font.ts)
- Certificado da LAN: [`tools/generate-lan-cert.mjs`](../../tools/generate-lan-cert.mjs)
- Build inicial: [`memory.md`](../../memory.md)
- Visão geral e comandos: [`README.md`](../../README.md)
- Teste da âncora: `tests/anchor-roundtrip.md`
