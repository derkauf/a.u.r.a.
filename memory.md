# A.U.R.A. v1 (paralela, por Lola) — log de desenvolvimento

> Variante para comparação. O repo `derkauf/a.u.r.a.` é a fonte de verdade.
> Construído 14/nov/2026 (madrugada), a partir de CONTEXT.md, Dispatch #1,
> Dispatch #2, plano de build e jornada Gemini.

## O que foi construído

- Scaffold IWSDK 1.1.0 (MR/passthrough, TypeScript) via
  `npx -y @iwsdk/create . -y --mode ar --language ts --install --no-git
  --scene-understanding --environment-raycast --skip-reference-warmup`.
  Node v24.22.1, npm 10.9.4. 261 pacotes.
- Demo do scaffold removida (robô, painéis de exemplo, plinths, labels,
  chime). Cena reescrita do zero: 3 stickers AprilTag + 3 painéis + câmera
  simulada + luzes.
- 3 dispositivos: lâmpada (id 0), ar-condicionado (id 1), fechadura (id 2),
  família `tag36h11`. Leitura simulada (pinch no sticker).
- Sistemas: AuraAnchorSystem, AuraPanelSystem, AuraCursorSystem.
- Testes unitários dos módulos puros (12 testes).

## Decisões tomadas durante o build

- **AprilTag em vez de QR** (direção do Diogo, 14/nov): o tag carrega só
  o id; o descritor do dispositivo vive no app (`DEVICE_DESCRIPTORS`).
  O módulo `src/qr-handshake.ts` foi escrito e depois descartado.
- **Persistência = 1 âncora de cena do SDK** (UUID em `localStorage`,
  chave `iwsdk_scene_anchor_uuid`): cada painel com `XRAnchor` fica preso
  ao grupo ancorado. O "vínculo por dispositivo" é o registro local
  (`aura_bound_devices_v1`).
- **Texto dinâmico via `setProperties({ text })` no elemento-pai**
  (mecanismo verificado no `@drawcall/uikitml`: o Text filho lê a
  propriedade `text` do pai; confirmado também no AGENTS.md de
  `public/ui/`).
- **Mostrar/esconder painel via `document.rootElement.setProperties`**
  (a UIKitMLAsset é um Group; o root é o Panel).
- **Âncora ativa via query `where: [eq(XRAnchor, 'attached', true)]`**
  (qualify/disqualify), sem polling por frame; `update()` só retenta
  vínculo enquanto houver painel sem XRAnchor.
- **Cursor:** anel + ponto, `createTransformEntity`, posição via
  `getWorldPosition` do alvo (LevelTag id → `getSceneObject`) ou da
  ponta do indicador direito; escondido sem sessão XR.
- **Painéis a 60 cm, escala 0,1** (460 unidades → 0,46 m), botões de 72
  (7,2 cm). Stickers a 1,50 m, painéis a 0,95 m.
- **AR Code (ar-code.com) avaliado e NÃO usado:** o QR dele aponta para
  a URL hospedada da plataforma, não carrega nosso payload e não oferece
  detecção no app WebXR. Fica como opção de material de demo.
- **Meta XR Simulator standalone NÃO é necessário** para o teste da
  âncora: o teste roda no IWER (emulador do `npm run dev`, perfil Quest 3).
  O standalone é para apps nativos.

## Verificação (nesta máquina, 14/nov/2026 ~01:50–02:30 PT)

| Checagem | Comando | Resultado |
|---|---|---|
| Typecheck | `npm run typecheck` | limpo (0 erros) |
| Testes unitários | `npm run test:unit` | **12/12 passaram** |
| Build | `npm run build` | OK em 12,05 s (aviso esperado: chunk > 500 kB) |
| Dev server | `npm run dev` | Vite pronto em ~4 s; `https://localhost:8081/` serve o HTML do app com injeção do IWER (`curl` confirmado); servidor parado depois (porta livre) |
| Cena | validação estrutural | JSON válido (`iwsdk.scene.v1`), 10 nós, 7 assets UIKitML referenciados existem |

## Não verificado (roda na máquina do Diogo)

- Renderização no navegador gerenciado (o Chromium do CLI estava
  baixando quando o servidor foi parado).
- Sessão XR no emulador; clique/pinch nos controles; teste de round-trip.
- Glifos `°C`/`ã`/`ç` na fonte do UIKitML; `display: none` do painel
  com raycast; clique no sticker fora do botão "Ler tag".

## Upload

Drive: pasta "A.U.R.A. — Documentação do Projeto" → subpasta
`aura-v1-lola-paralela` (árvore completa do repo, sem node_modules/dist/.git)
+ `a.u.r.a.-by-lola-guia-inicial.pdf` (guia inicial).
