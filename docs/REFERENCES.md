# Referências do A.U.R.A. (input-ref-src)

Pastas onde o usuário deposita referências a qualquer momento. Elas não fazem parte do app (o servidor de dev ignora `docs/`); servem de base para decisões de visual, interface e som.

**Como saber se entrou algo novo:** `npm run refs:check` compara as pastas com o inventário em [`docs/references.json`](references.json) e lista o que entrou (`+`) ou saiu (`-`). Depois de revisar as novidades, registre-as com `npm run refs:check -- --update`. A regra de sessão no `CLAUDE.md` manda fazer essa conferência no início de cada sessão, então o usuário não precisa avisar.

| Pasta | O que é | Usar em |
|---|---|---|
| [`docs/aura-visual-id/`](aura-visual-id/) | Identidade visual do A.U.R.A.: imagens e vídeos. Inclui o **vídeo postado no Devpost**: [`gemini_generated_video_f969b831.mp4`](aura-visual-id/gemini_generated_video_f969b831.mp4) (5,9 MB). | Vídeo da submissão, materiais de apresentação, Deeper Mode (Phase 4) |
| [`docs/ux/user-interface-refs/`](ux/user-interface-refs/) | Referências de interface (dashboards, widgets, conceitos de site/app) para ter em mente ao criar telas | Toda nova interface; temas da Phase 4 |
| [`docs/ux/hud-reference/`](ux/hud-reference/) | Referências de HUD holográfico (ciano neon, linhas finas, brilho). A subpasta `archived/` tem as descartadas | Deeper Mode (tema holograma ciano, Phase 4) |
| [`docs/ux/quest-reference/`](ux/quest-reference/) | Screenshots da interface do Horizon OS (ícones de app, janelas, quick settings) | Estilo base da interface (Phase 2) e atalho no quick menu |
| [`docs/ux/sound-design/`](ux/sound-design/) | Efeitos sonoros de UI. `us-single-seam.mp3` é o som de confirmação atual (`public/audio/ui-select.mp3`) | Áudio e feedback; áudio espacial (Phase 4) |

## Observações

- **Tamanho:** `docs/aura-visual-id/` tem ~99 MB, quase tudo em vídeo (o maior, `360rotation.mp4`, tem 44 MB). Nenhum arquivo passa do limite de 100 MB do GitHub, mas vídeos ficam para sempre no histórico do git. **Decidido em 17/11:** só o vídeo do Devpost (`gemini_generated_video_f969b831.mp4`) entra no git; os outros vídeos de `docs/aura-visual-id/` ficam só nesta máquina (`.gitignore`). O `refs:check` continua enxergando todos.
- **Inventário registrado em 2026-11-17:** 43 arquivos nas 5 pastas.
