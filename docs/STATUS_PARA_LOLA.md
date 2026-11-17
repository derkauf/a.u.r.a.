# Status do A.U.R.A. para a Lola

Exportação do estado do repositório `aura-v1-lola` para quem acompanha o projeto sem acesso ao código. Só fatos verificáveis no repositório; o que não pôde ser verificado está marcado como **não verificado**.

**Versão deste status:** 2026-11-17 (primeira versão: linha de base)
**Último commit:** `dc82aa3` (2026-11-17 03:06). **Atenção:** há 42 arquivos alterados ou novos ainda **sem commit** (24 alterados, 18 novos); eles estão descritos abaixo como "não commitado".

---

## 1. Resumo

O A.U.R.A. (Ambient User Responsive Automation) é um app de automação residencial espacial, hands-first, para Meta Quest: cada dispositivo da casa é representado por um AprilTag (`tag36h11`) e, ao ser lido, ganha um painel de controle ancorado no ambiente com uma âncora espacial persistente. A v1 cobre um cômodo e três dispositivos **simulados**: lâmpada (id 1), ar-condicionado (id 2) e fechadura (id 3).

- **Stack:** WebXR com Immersive Web SDK (IWSDK) `@iwsdk/core` 1.1.0, TypeScript, Vite, painéis em UIKitML (kit Horizon).
- **Fase 1 publicada:** https://aura.sixvectors.app/ (Vercel, projeto `aura-v1-lola`), marcada no git como tag `fase-1` (commit `dc82aa3`).
- **Ambiente de teste:** https://aura-dev.sixvectors.app/ (projeto Vercel separado `aura-v1-lola-dev`), com a versão em desenvolvimento.

## 2. O que mudou desde o último status

Primeira versão: esta seção registra o estado atual como linha de base. A partir do próximo status, aqui entram só as diferenças.

## 3. O que está pronto

Verificado no código (typecheck limpo e 16 de 16 testes unitários em 2026-11-17).

**Commitado (Fase 1, tag `fase-1`):**
- Leitura **simulada** do AprilTag → registro do dispositivo → painel ancorado: `src/markers/apriltag-handshake.ts`, `src/devices/device-registry.ts`, `src/anchors/anchor-service.ts`.
- IDs dos tags 1, 2 e 3 (o 0 não é usado, porque o gerador do RealityScan Desktop começa no 1): `src/markers/apriltag-handshake.ts`, `tests/unit.test.ts`.
- Fonte Inter com caracteres latinos completos (acentos), gerada em tempo de execução: `src/ui/aura-font.ts`, `public/fonts/`.
- Persistência local de vínculos e estados dos dispositivos (`aura_device_state_v1`, `aura_bound_devices_v1`): `src/devices/device-registry.ts`.
- Certificado HTTPS para a rede local (`npm run cert:lan`): `tools/generate-lan-cert.mjs`, `vite.config.ts`.
- Deploy na Vercel a partir de uma cópia sem `.git` (`npm run deploy`): `tools/deploy-vercel.mjs`.
- PDFs da submissão (roteiro do vídeo e rascunho do Devpost): `docs/submission/`, gerados por `tools/generate-submission-pdfs.py`.

**Não commitado (publicado só no aura-dev):**
- Interface no estilo Horizon OS: ícones de app para os tags, janelas com barra e X, engrenagem: `public/ui/*.uikitml`, `tools/generate-apriltag-stickers.py`.
- Efeito de hover nos ícones (cresce 20%, com histerese): `src/ui/hover-scale-system.ts`.
- HUD "Follow my view" (segue a cabeça com atraso; limites de 50° na horizontal e 40° na vertical): `src/ui/hud-follow-system.ts`, `src/ui/view-follow.ts`.
- i18n por arquivos, com fallback em inglês e 5 idiomas (en, pt-BR, es, fr, de): `src/i18n/i18n.ts`, `src/locales/*.json`.
- Armazenamento local das configurações (`aura_settings_v1`): `src/settings/settings-store.ts`.
- Janela de Configurações em 6 seções: `public/ui/settings.uikitml`, `src/ui/settings-panel-system.ts`.
  - Dispositivos: estado, testar, renomear por sugestões, recalibrar, remover, limpar tudo (`src/devices/device-names.ts`, `src/devices/device-text.ts`).
  - Interação: sensibilidade do pinch Leve/Média/Firme (`src/ui/activation.ts`), snap magnético e alcance de ativação.
  - HUD: seguir a visão, opacidade, tamanho S/M/L e telemetria (`src/ui/appearance-system.ts`, `public/ui/telemetry.uikitml`).
  - Áudio: som de confirmação (`src/ui/feedback-sound.ts`, `public/audio/ui-select.mp3`, cópia de `docs/ux/sound-design/sound-fx/ui/us-single-seam.mp3`).
  - Conforto: idioma e altura sentado/em pé.
  - Privacidade: exportar a sala em JSON e apagar a calibração (`src/settings/room-config.ts`).
- Cursor que mostra o ponto real do raio, com snap ajustável: `src/input/hand-ray-cursor.ts`.
- Deploy do ambiente de teste (`npm run deploy:dev`): `tools/deploy-vercel.mjs`.

## 4. O que está em andamento

- **Etapa 2 das Configurações (não iniciada):** Deeper Mode (tema holograma ciano), modo escuro, paleta para daltônicos, alto contraste, áudio espacial, intensidade do brilho, botão de importar JSON (a função existe em `src/settings/room-config.ts`, falta a interface) e fechar a janela com um pinch fora dela.
- **Commit e push** das mudanças acima: pendente.

## 5. O que foi testado

| Teste | Onde | Resultado | Data |
|---|---|---|---|
| Typecheck e testes unitários (16) | PC | Passam | 2026-11-17 |
| Build de produção | PC | Passa | 2026-11-17 |
| Round-trip da âncora (refresh e reabrir: painéis no mesmo lugar, "Âncora: ativa (restaurada)", valores mantidos) | Quest 3S e emulador | Passou (relatado pelo usuário, registrado em `docs/dev-notes/`) | 2026-11-17 |
| App abre no Quest pela rede local e por aura-dev | Quest 3S | Funciona (relatado pelo usuário) | 2026-11-17 |
| HUD "Follow my view" com atraso | Quest 3S | Funciona; o usuário pediu mais folga lateral, já aplicada (**não verificado** depois do ajuste) | 2026-11-17 |
| Pinch e snap (cursor no ponto real do raio, pinch no modo Leve) | Quest 3S | Atraso e glitches relatados na primeira versão; depois da correção, "funcionando perfeitamente" (relatado pelo usuário) | 2026-11-17 |
| Configurações: abrir pela engrenagem, trocar de seção, idioma, tamanho, opacidade, telemetria, renomear, testar dispositivo | Emulador (IWER, perfil Quest 3) | Funcionam | 2026-11-17 |
| Link oficial https://aura.sixvectors.app/ no Quest | — | **Não verificado** | — |
| Exportar JSON no Quest Browser (salvar em Downloads) | — | **Não verificado** | — |

## 6. Decisões tomadas

- **WebXR / IWSDK em vez do caminho nativo (Meta Spatial SDK)**, decidido em 11/nov (`README.md`). Os juízes abrem um link, sem instalar nada; as âncoras persistentes funcionam no Quest Browser.
- **AprilTag em vez de QR code** (`README.md`, `docs/apriltag-markers.md`): o tag carrega só o id; o significado do dispositivo vive no app.
- **IDs 1, 2 e 3**, sem o 0, porque o gerador do RealityScan Desktop começa no 1 (`src/markers/apriltag-handshake.ts`).
- **Dispositivos simulados (`sim://`) na v1**, com o caminho para dispositivos reais via Matter (`matter://`) sem mudar os painéis (`src/markers/apriltag-handshake.ts`).
- **Hospedagem na Vercel, com domínio próprio** (`aura.sixvectors.app`) e um ambiente de teste separado (`aura-dev.sixvectors.app`). A ligação automática com o GitHub foi desligada: um push não publica nada, e publicar é só por `npm run deploy` / `npm run deploy:dev` (`docs/dev-notes/PROGRESS.md`).
- **Local-first:** configurações e calibração ficam só no headset, sem nuvem (`src/settings/settings-store.ts`).
- **Ativar no início do pinch (modo Leve) por padrão**, porque o clique da biblioteca de ponteiros só conta se apertar e soltar acontecerem em menos de 300 ms, e o pinch real costuma ser mais longo (`src/ui/activation.ts`).
- **Renomear por sugestões**, porque não há teclado dentro da sessão imersiva (`src/devices/device-names.ts`).
- **Deeper Mode = tema holograma ciano**, a partir das referências em `docs/ux/hud-reference/` (decidido, não implementado).

## 7. Bloqueios e pendências

- **Cabo USB:** o Quest aparece como "unauthorized" no `adb`. Sem o aceite da depuração USB dentro do headset, não há teste automatizado nem controle pelo cabo. `docs/dev-notes/PROGRESS.md` ainda diz "cabo quebrado" e está desatualizado.
- **Prazo da submissão:** quarta, 18/nov/2026, 12:00 PT (fonte: `../CONTEXT.md`, fora do repositório). Faltam o vídeo, o texto final do Devpost e o último deploy em produção.
- **Regra da competição:** depois do prazo, o app publicado não pode mudar até o resultado.
- **README desatualizado:** ainda diz "GitHub Pages como primário" e "deploy ainda não foi feito".
- **O guia em PDF** (`a.u.r.a.-by-lola-guia-inicial.pdf`) também está desatualizado em relação à interface nova.
- **42 arquivos sem commit:** o código mais recente existe só nesta máquina e no deploy do aura-dev.
- **A âncora não vai no JSON exportado:** o OpenXR prende a âncora ao headset que a criou; em outro headset, os tags precisam ser lidos de novo.

## 8. Próximos passos

1. Commit e push das mudanças pendentes.
2. Decidir o que da etapa 2 entra antes do prazo.
3. Publicar a versão final em https://aura.sixvectors.app/ e testar no Quest.
4. Gravar o vídeo seguindo `docs/submission/aura-roteiro-video.pdf`.
5. Finalizar o texto do Devpost (`docs/submission/aura-devpost-rascunho.pdf`) e submeter.
6. Atualizar o README, o guia em PDF e `docs/dev-notes/`.

## 9. Arquivos principais

| Caminho | O que é |
|---|---|
| `iwsdk.config.json` | Configuração do projeto IWSDK: cena, AR, recursos de XR |
| `src/index.ts` | Cria o World e registra os sistemas |
| `src/assets.ts` | Catálogo dos painéis UIKitML |
| `public/scenes/main.iwsdk.scene.json` | Cena: posições dos ícones, janelas, engrenagem, configurações e telemetria |
| `public/ui/*.uikitml` | Painéis: ícones dos tags, janelas dos dispositivos, câmera, configurações, engrenagem, telemetria |
| `src/markers/apriltag-handshake.ts` | Tabela AprilTag → dispositivo e descritores |
| `src/devices/` | Registro dos dispositivos (estado e vínculos), nomes e textos |
| `src/anchors/` | Âncora persistente e linha de status da âncora |
| `src/ui/` | Sistemas de interface: janelas, localização, configurações, HUD, hover, aparência, ativação, som, fonte |
| `src/input/hand-ray-cursor.ts` | Cursor do raio com snap magnético |
| `src/i18n/i18n.ts`, `src/locales/` | Sistema de idiomas e um arquivo por idioma |
| `src/settings/` | Armazenamento das configurações e exportar/importar a sala |
| `tests/unit.test.ts` | Testes unitários (16) |
| `tools/` | Geradores (stickers, guia PDF, PDFs da submissão, certificado LAN) e deploy na Vercel |
| `docs/dev-notes/` | Notas de sessão: PROGRESS, RESUME, logs |
| `docs/submission/` | Roteiro do vídeo e rascunho do Devpost (PDF) |
| `docs/ux/` | Referências: Quest, HUD, som, especificação do painel |
| `docs/journey/` | Registro da evolução (screenshot da Fase 1) |

---

## Histórico de versões deste status

- **2026-11-17** — Primeira versão (linha de base). Fase 1 publicada e marcada; interface estilo Quest, HUD, Configurações em 6 seções e i18n em 5 idiomas no aura-dev, ainda sem commit.
