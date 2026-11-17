# Retomar: A.U.R.A. v1 paralela (escrito em 2026-11-17, fim da Parte 5)

Comece por aqui quando voltar. O `/devlog` (ou `/encerrar`) reescreve este arquivo no fim de cada sessão.

Este arquivo lista só **ações**. O **estado** (o que está pronto, travado ou esperando) fica em [PROGRESS.md](PROGRESS.md). Se os dois parecerem discordar, vale o PROGRESS.

## 0. Primeira checagem

- **Prazo:** confira quanto falta para a submissão (PROGRESS › Próximos 1). O que for para os juízes precisa estar publicado antes.
- **Decisão pendente:** pergunte qual fase vai para a produção dos juízes (Phase 2 ou a Phase 3 atual).
- **Teste pendente no Quest:** pergunte o resultado da última versão no aura-dev (ver seção 3).
- **Referências novas:** `npm run refs:check`; conte ao usuário o que entrou e registre com `npm run refs:check -- --update`.
- **Git:** `git status` limpo; `git tag -l "phase-*"` lista phase-1 e phase-2.
- **Servidor de dev:** `npm run dev` como tarefa em segundo plano (acompanhada). Assets novos só aparecem no editor depois de `npx @iwsdk/cli dev restart`.

## 1. Ações pendentes, em ordem

| # | Ação | Antes | O que faz |
|---|---|---|---|
| 1 | `npm run deploy` (produção) | Decisão do usuário sobre a fase; se não for o código atual, publicar a partir da tag | Publica em https://aura.sixvectors.app/ a versão dos juízes |
| 2 | Ajustes da Phase 3 conforme o teste no Quest | Resultado da seção 3 | Calibrar `CAMERA_PITCH_DOWN_DEG`, `FOCAL_RATIO`, `WINDOW_RAISE_M`, `VIRTUAL_TAG_TILE_OFFSET_UNITS` em `src/markers/tag-placement.ts` |
| 3 | Profundidade do tag pelo ambiente | Skill `iwsdk-dev`; ver `features.environmentRaycast` / hit-test | O tag virtual deixa de "escorregar" quando visto de outro ângulo |
| 4 | Scanner contínuo, sem janela | Câmera confirmada (já está) | Lê tags desde a entrada no AR, como a câmera do celular; a janela vira diagnóstico |
| 5 | Salvar a posição dos tags | `src/markers/tag-placement.ts` (hoje só na memória) e `src/anchors/anchor-service.ts` | Os tags virtuais voltam no lugar depois de recarregar |
| 6 | TV em Configurações › Dispositivos; textos em es/fr/de | `src/ui/settings-panel-system.ts` (`DEVICES`), `public/ui/settings.uikitml`, `src/locales/*.json` | Completa o dispositivo de teste |
| 7 | Congelar a Phase 3 | Phase 3 validada no Quest | `git tag -a phase-3`, push da tag, `npm run deploy:phase -- phase-3`; `url` e `frozenOn` em `src/phases/phases.ts` |
| 8 | `docs/STATUS_PARA_LOLA.md`, README, guia em PDF, rascunho do Devpost | — | Ver Parte 5, seção 8, do log de 17/11 |

## 2. Como verificar

- **Código:** `npm run typecheck`; `npm run test:unit` com 20 de 20; `npm run build`.
- **Console:** `npx @iwsdk/cli browser logs --input-json '{"count":300}'` sem erros.
- **Detector:** os testes leem os tags 1, 2 e 12. Para conferir um ícone de tag: `ui render-preview` do `sticker-*`, e passar o PNG pelo `AprilTagDetector` (precisa dar o id do ícone com 0 bits errados).
- **Publicado:** `npm run deploy:dev` e `curl` com 200 em https://aura-dev.sixvectors.app/.
- **UIKitML:** o `<style>` não aceita comentários nem `object-fit`; `<img>` exige `src`.

## 3. O que testar no Quest (aura-dev)

- Permissão: Configurações › Privacidade e segurança › Navegador › **Headset cameras** ligado.
- Scan (botão ao lado da engrenagem) → tag 00a → janela da TV acima do tag e o tag virtual sobre o papel.
- O tag virtual coincide com o papel? (correção de 4° nova)
- Andar mais de 1,2 m: os tags virtuais e as janelas continuam visíveis? (culling desligado)
- Tocar no tag virtual abre e fecha a janela?
- Telemetria a 15° acima, por cima das janelas.

## 4. Próximo marco

- Submissão no Devpost, com o vídeo, antes do prazo.

## 5. Esperando outros

- Veja PROGRESS › Esperando.

## 6. Outras pendências

- Atalho do A.U.R.A. no quick menu do Quest.
- `OVRService` (Meta Horizon Link) parado no PC; religar com `Start-Service OVRService` como administrador ou reiniciando.
- Vídeos de `docs/ux/quest-reference/` ficam fora do git (`.gitignore`).

## Arquivos de referência

- Estado: [PROGRESS.md](PROGRESS.md)
- Última sessão: [chat-logs/2026-11-17-instalacao-dev-notes.md](chat-logs/2026-11-17-instalacao-dev-notes.md) (Parte 5)
- Identidade visual: [`docs/ux/VISUAL_ID.md`](../ux/VISUAL_ID.md)
- Scanner: [`src/camera/tag-scanner-system.ts`](../../src/camera/tag-scanner-system.ts); detector: [`src/markers/apriltag-detector.ts`](../../src/markers/apriltag-detector.ts); posição: [`src/markers/tag-placement.ts`](../../src/markers/tag-placement.ts)
- Tabela de tags: [`src/markers/apriltag-handshake.ts`](../../src/markers/apriltag-handshake.ts); marcadores: [`docs/apriltag/`](../apriltag/)
- Fases: [`src/phases/phases.ts`](../../src/phases/phases.ts); deploy: [`tools/deploy-vercel.mjs`](../../tools/deploy-vercel.mjs)
- Status para a Lola: [`docs/STATUS_PARA_LOLA.md`](../STATUS_PARA_LOLA.md)
