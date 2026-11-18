# Retomar: A.U.R.A. v1 paralela (escrito em 2026-11-17, fim da Parte 5)

Comece por aqui quando voltar. O `/devlog` (ou `/encerrar`) reescreve este arquivo no fim de cada sessão.

Este arquivo lista só **ações**. O **estado** (o que está pronto, travado ou esperando) fica em [PROGRESS.md](PROGRESS.md). Se os dois parecerem discordar, vale o PROGRESS.

## 0. Primeira checagem

- **Prazo:** confira quanto falta para a submissão (PROGRESS › Próximos). A produção já está na Phase 3.
- **Pergunte ao usuário:** o resultado do teste da produção no Quest, e se a página de entrada e o guia (hoje só no aura-dev) podem ir para a produção.
- **A revisar:** leia PROGRESS › A revisar antes de mexer no Devpost ou no vídeo.
- **Referências novas:** `npm run refs:check`; conte ao usuário o que entrou e registre com `npm run refs:check -- --update`.
- **Git:** `git status`. Pode haver arquivos sem commit da página de entrada e do guia (`index.html`, `public/guide/`, `docs/guide/`, `tools/generate-user-guide.py`, `docs/ux/ux-illustrated-guide/`, `tools/check-refs.mjs`, `docs/REFERENCES.md`, `docs/references.json`); faça o commit quando o usuário aprovar.
- **Servidor de dev:** `npm run dev` como tarefa em segundo plano. Assets novos só aparecem no editor depois de `npx @iwsdk/cli dev restart`.

## 1. Ações pendentes, em ordem

| # | Ação | Antes | O que faz |
|---|---|---|---|
| 1 | Página de entrada e guia na produção | Teste do usuário no aura-dev; o "sim" dele | `npm run deploy`, commit e push |
| 2 | Devpost e vídeo | PROGRESS › A revisar (câmera exige tags e permissão) | Texto do "What it does" (`tools/generate-submission-pdfs.py`); o vídeo usa `docs/guide/aura-user-guide.pdf` como roteiro |
| 3 | Ajustes da Phase 3 pelo teste no Quest | Resultado do usuário | Calibrar `CAMERA_PITCH_DOWN_DEG`, `FOCAL_RATIO`, `WINDOW_RAISE_M`, `VIRTUAL_TAG_TILE_OFFSET_UNITS` em `src/markers/tag-placement.ts`; rastro do cursor em `src/input/hand-ray-cursor.ts` |
| 4 | Salvar a posição dos tags | `src/markers/tag-placement.ts`, `src/anchors/anchor-service.ts` | Os tags virtuais voltam no lugar depois de recarregar |
| 5 | Profundidade pelo ambiente e scanner contínuo | Skill `iwsdk-dev` | O tag virtual não escorrega em outro ângulo; leitura sem janela |
| 6 | Convenção: próximos dispositivos e propostas | Planilha [A.U.R.A. Device Convention](https://claude.ai/artifact/GW6KU3KYj1PZGH8RzKs9Hh) e `src/devices/device-convention.ts` | Confirmar as propostas (lâmpada, TV, AC desligado) e seguir o que está "Falta fazer" |
| 7 | Congelar a Phase 3 | Fase validada pelo usuário | `git tag -a phase-3`, push, `npm run deploy:phase -- phase-3`; `url` e `frozenOn` em `src/phases/phases.ts` |
| 8 | Docs derivados | — | README (apontar para o guia novo), guia inicial em PT (`tools/generate-guia-pdf.py`), `docs/STATUS_PARA_LOLA.md` |

## 2. Como verificar

- **Código:** `npm run typecheck`; `npm run test:unit` com 22 de 22; `npm run build`.
- **Guia:** `python tools/generate-user-guide.py` (precisa de fpdf2 e Pillow; usa a Inter de `public/fonts`); renderizar as páginas e conferir.
- **Página de entrada:** no navegador, a página aparece antes do app; "Allow camera" mostra o resultado; "Don't show this again" grava `aura_welcome_seen`.
- **Publicado:** `curl` com 200 em https://aura.sixvectors.app/, aura-dev, aura-phase1 e aura-phase2; `/guide/aura-user-guide.pdf` com `application/pdf`.

## 3. O que testar no Quest

- **Produção:** liberar Headset cameras, escanear os tags, round-trip da âncora.
- **aura-dev:** página de entrada → "Allow camera" (o pedido deve oferecer Headset cameras) → "Continue to the app".
- Rastro do cursor, cores de estado (fechadura vermelha/verde, AC azul), Restart app e Return tags to HUD.

## 4. Próximo marco

- Submissão no Devpost, com o vídeo, antes do prazo.

## 5. Esperando outros

- Veja PROGRESS › Esperando.

## 6. Outras pendências

- Atalho do A.U.R.A. no quick menu do Quest.
- `OVRService` parado no PC; religar com `Start-Service OVRService` como administrador ou reiniciando.

## Arquivos de referência

- Estado: [PROGRESS.md](PROGRESS.md)
- Última sessão: [chat-logs/2026-11-17-instalacao-dev-notes.md](chat-logs/2026-11-17-instalacao-dev-notes.md) (Parte 5)
- Guia do usuário: [`docs/guide/aura-user-guide.pdf`](../guide/aura-user-guide.pdf), gerado por [`tools/generate-user-guide.py`](../../tools/generate-user-guide.py); página de entrada: [`index.html`](../../index.html)
- Identidade visual: [`docs/ux/VISUAL_ID.md`](../ux/VISUAL_ID.md); convenção de estados: [`docs/ux/DEVICE_CONVENTION.md`](../ux/DEVICE_CONVENTION.md); estilo das ilustrações: [`docs/ux/ux-illustrated-guide/`](../ux/ux-illustrated-guide/)
- Scanner e tags: [`src/camera/tag-scanner-system.ts`](../../src/camera/tag-scanner-system.ts), [`src/markers/`](../../src/markers/)
- Fases e deploy: [`src/phases/phases.ts`](../../src/phases/phases.ts), [`tools/deploy-vercel.mjs`](../../tools/deploy-vercel.mjs)
