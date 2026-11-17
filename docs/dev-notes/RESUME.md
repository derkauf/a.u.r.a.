# Retomar: A.U.R.A. v1 paralela (escrito em 2026-11-17)

Comece por aqui quando voltar. O `/devlog` (ou `/encerrar`) reescreve este arquivo no fim de cada sessão.

Este arquivo lista só **ações**. O **estado** (o que está pronto, travado ou esperando) fica em [PROGRESS.md](PROGRESS.md). Se os dois parecerem discordar, vale o PROGRESS.

## 0. Primeira checagem

- **Prazo:** confira quanto falta para a submissão (data em PROGRESS › Próximos 1). Tudo que for para os juízes precisa estar publicado antes dele.
- **Esperando:** veja PROGRESS › Esperando e pergunte ao usuário se os tags já foram impressos e se o cabo foi autorizado.
- **Decisão pendente:** pergunte qual fase vai para a produção dos juízes (PROGRESS › Próximos 1).
- **Referências novas:** `npm run refs:check` lista o que o usuário depositou nas pastas de referência (`docs/REFERENCES.md`). Conte a ele o que entrou e registre com `npm run refs:check -- --update`.
- **Git:** `git status` deve estar limpo; `git tag -l "phase-*"` deve listar as fases congeladas.
- **Servidor de dev:** rode `npm run dev` como tarefa em segundo plano (acompanhada), não solto. Depois de mexer no `adb`, confira `npx @iwsdk/cli dev status`.

## 1. Ações pendentes, em ordem

| # | Ação | Antes | O que faz |
|---|---|---|---|
| 1 | `npm run deploy` (produção) | Decisão do usuário sobre a fase; se não for o código atual, fazer `git checkout` da tag numa cópia ou mudar o script | Publica em https://aura.sixvectors.app/ a versão dos juízes |
| 2 | Phase 3 em `src/` (câmera + detector + âncora no tag) | `CURRENT_PHASE = 'phase-3'` em `src/phases/phases.ts`; skill `iwsdk-dev`; ler `docs/apriltag/README.md` | Leitura real dos AprilTags impressos pela câmera do Quest |
| 3 | Congelar a Phase 3 | Phase 3 validada no Quest | `git tag -a phase-3`, push da tag, `npm run deploy:phase -- phase-3`; ajustar `url` e `frozenOn` da Phase 3 em `src/phases/phases.ts` |
| 4 | Rascunho do Devpost (`tools/generate-submission-pdfs.py`) | Saber qual fase está em produção | Atualizar o "What it does" para a versão publicada; gerar o PDF de novo |
| 5 | `docs/STATUS_PARA_LOLA.md` | — | Nova versão no topo do histórico, com as fases congeladas |
| 6 | `README.md` e `tools/generate-guia-pdf.py` | — | Atualizar a parte de interface e os comandos (ver a seção 6 da Parte 4 do log) |

## 2. Como verificar

- **Código:** `npm run typecheck` sem erros; `npm run test:unit` com 16 de 16; `npm run build` ok (o aviso de chunk acima de 500 kB é esperado).
- **Console:** `npx @iwsdk/cli browser logs --input-json '{"count":400}'` sem erros e sem `Missing glyph`.
- **Endereços:** `curl -s -o /dev/null -w '%{http_code}' <url>` com 200 em produção, aura-phase1, aura-phase2 e aura-dev.
- **Mira no emulador:** os painéis com rotação de -6° ficam mais perto embaixo (z ≈ -0.585 na barra); com o tamanho L, o layout escala 1.25×. Use `ui inspect` (`relativeCenter`, relativo ao pai) para calcular a posição antes de clicar.

## 3. O que testar no Quest

- **Phase 3:** com um tag na tela do outro monitor ou impresso, conferir se a câmera abre dentro da sessão XR e se o tag é reconhecido.
- **Produção:** depois do deploy, abrir o link no Quest e fazer o round-trip (refresh e reabrir: "Âncora: ativa (restaurada)").
- **Pendentes da Phase 2:** limites do HUD (50°/40°), alcance de ativação, exportar JSON, "Abrir" uma fase em Configurações › Project phases.

## 4. Próximo marco

- Submissão no Devpost, com o vídeo, antes do prazo.

## 5. Esperando outros

- Veja PROGRESS › Esperando.

## 6. Outras pendências

- Atalho do A.U.R.A. no quick menu do Quest.
- O `OVRService` (Meta Horizon Link) foi parado no PC para liberar o cabo. Para religar: `Start-Service OVRService` como administrador, ou reiniciar o PC.
- Phase 4 e Phase 5: ver PROGRESS › Agora › Project phases.

## Arquivos de referência

- Estado: [PROGRESS.md](PROGRESS.md)
- Última sessão: [chat-logs/2026-11-17-instalacao-dev-notes.md](chat-logs/2026-11-17-instalacao-dev-notes.md) (Parte 4)
- Fases: [`src/phases/phases.ts`](../../src/phases/phases.ts); deploy: [`tools/deploy-vercel.mjs`](../../tools/deploy-vercel.mjs)
- Marcadores: [`docs/apriltag/`](../apriltag/)
- Submissão: [`docs/submission/`](../submission/)
- Status para a Lola: [`docs/STATUS_PARA_LOLA.md`](../STATUS_PARA_LOLA.md)
- Configurações: [`src/ui/settings-panel-system.ts`](../../src/ui/settings-panel-system.ts), [`src/settings/settings-store.ts`](../../src/settings/settings-store.ts)
- Teste da âncora: `tests/anchor-roundtrip.md`
