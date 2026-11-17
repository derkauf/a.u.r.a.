# Status do A.U.R.A. para a Lola

Exportação do estado do repositório `aura-v1-lola` para quem acompanha o projeto sem acesso ao código. Só fatos verificáveis no repositório; o que não pôde ser verificado está marcado como **não verificado**.

**Versão deste status:** 2026-11-17, terceira versão
**Último commit:** `c54056c` (dev notes), sobre `86ff8b4` (Phase 2 congelada). Tudo no GitHub; nenhuma mudança de código sem commit.

---

## 1. Resumo

O A.U.R.A. (Ambient User Responsive Automation) é um app de automação residencial espacial, hands-first, para Meta Quest. Cada dispositivo da casa é representado por um AprilTag (`tag36h11`); ao ser lido, o tag ganha um painel de controle ancorado no ambiente com uma âncora espacial persistente. É um **MVP**: os tags simulam a conexão com os dispositivos. A v1 cobre um cômodo e três dispositivos **simulados**: lâmpada (id 1), ar-condicionado (id 2) e fechadura (id 3).

- **Stack:** WebXR com Immersive Web SDK (IWSDK) `@iwsdk/core` 1.1.0, TypeScript, Vite, painéis em UIKitML (kit Horizon), hospedagem na Vercel.
- **Produção (link dos juízes):** https://aura.sixvectors.app/, **ainda na Phase 1**.
- **Fases congeladas:** Phase 1 em https://aura-phase1.sixvectors.app/ (tag `phase-1`); Phase 2 em https://aura-phase2.sixvectors.app/ (tag `phase-2`).
- **Desenvolvimento:** https://aura-dev.sixvectors.app/, hoje igual à Phase 2.

## 2. O que mudou desde o último status

Desde a segunda versão (mesmo dia):

- **Fases congeladas e publicadas.** Cada marco do projeto agora é uma tag do git publicada sem mudanças no próprio endereço. O comando `npm run deploy:phase -- phase-N` usa o código da tag, nunca o diretório de trabalho. Motivo: preservar a evolução do projeto em vez de perdê-la sob as melhorias seguintes. Arquivos: `tools/deploy-vercel.mjs`, `package.json`.
- **Menu "Project phases" no app** (Configurações, 7ª seção): lista as 5 fases com resumo, data e estado; "Abrir" carrega a build congelada. Arquivos: `src/phases/phases.ts`, `src/ui/settings-panel-system.ts`, `public/ui/settings.uikitml`, `src/locales/*.json`.
- **Marcos definidos** (aprovados pelo usuário): Phase 1 = tags simulados; Phase 2 = HUD estilo Quest e Configurações; Phase 3 = leitura real pela câmera; Phase 4 = Deeper Mode, temas e áudio espacial; Phase 5 = dispositivos reais via Matter.
- **"Phase" em inglês** em toda a documentação e no app; a tag `fase-1` virou `phase-1` (mesmo commit). Pedido do usuário.
- **Marcadores para impressão** guardados em `docs/apriltag/` (PDF `tag36h11`, IDs 1–12, ~112 mm, com notas de impressão).
- **Tags impressos e colados** pelo cômodo (paredes e porta), em papel fosco de 200 g (relatado pelo usuário). Prontos para o teste da Phase 3.
- **Correção:** o UIKitML descarta texto só de espaço, e por isso os resumos das fases e as linhas de feedback das Configurações nunca apareciam. Arquivo: `public/ui/settings.uikitml`.
- **`.gitattributes`:** PDFs, imagens, áudio, vídeo e fontes marcados como binários, para o git não corromper o PDF dos marcadores.
- **Notas de sessão atualizadas:** `docs/dev-notes/` (log de 17/11, Parte 4; PROGRESS; RESUME).

## 3. O que está pronto

Verificado no código (typecheck limpo e 16 de 16 testes unitários em 2026-11-17).

**Phase 1 (tag `phase-1`, commit `dc82aa3`):**
- Leitura **simulada** do AprilTag → registro do dispositivo → painel ancorado: `src/markers/apriltag-handshake.ts`, `src/devices/device-registry.ts`, `src/anchors/anchor-service.ts`.
- IDs dos tags 1, 2 e 3 (o 0 não é usado, porque o gerador do RealityScan Desktop começa no 1).
- Fonte Inter com caracteres latinos completos (acentos): `src/ui/aura-font.ts`, `public/fonts/`.
- Persistência local de vínculos e estados dos dispositivos: `src/devices/device-registry.ts`.

**Phase 2 (tag `phase-2`, commit `86ff8b4`):**
- Interface no estilo Horizon OS: ícones de app para os tags, janelas com barra e X, engrenagem: `public/ui/*.uikitml`, `tools/generate-apriltag-stickers.py`.
- Hover nos ícones (cresce 20%, com histerese): `src/ui/hover-scale-system.ts`.
- HUD "Follow my view" (limites de 50° na horizontal e 40° na vertical): `src/ui/hud-follow-system.ts`, `src/ui/view-follow.ts`.
- i18n por arquivos, com fallback em inglês e 5 idiomas: `src/i18n/i18n.ts`, `src/locales/*.json`.
- Configurações em 7 seções, salvas localmente (`aura_settings_v1`): `public/ui/settings.uikitml`, `src/ui/settings-panel-system.ts`, `src/settings/`.
  - Dispositivos: estado, testar, renomear por sugestões, recalibrar, remover, limpar tudo.
  - Interação: sensibilidade do pinch (`src/ui/activation.ts`), snap magnético, alcance de ativação.
  - HUD: seguir a visão, opacidade, tamanho S/M/L, telemetria.
  - Áudio: som de confirmação (`us-single-seam.mp3`).
  - Conforto: idioma e altura sentado/em pé.
  - Privacidade: exportar JSON e apagar a calibração.
  - Project phases: as fases congeladas (`src/phases/phases.ts`).
- Cursor no ponto real do raio, com snap ajustável: `src/input/hand-ray-cursor.ts`.

**Ferramentas e documentos:**
- Deploys: `npm run deploy` (produção), `deploy:dev`, `deploy:phase` (`tools/deploy-vercel.mjs`).
- Submissão: roteiro do vídeo e rascunho do Devpost (com Vision, MVP e a frase da troca de stack) em `docs/submission/`.
- Marcadores para imprimir: `docs/apriltag/`.

## 4. O que está em andamento

- **Phase 3 (próxima, não iniciada):** leitura dos AprilTags impressos pela câmera do Quest, com a âncora criada onde o tag está. Os tags já estão colados no cômodo. A dúvida principal é se o navegador do Quest libera a câmera dentro da sessão XR; isso só se responde testando no headset.
- **Decisão pendente:** qual fase vai para a produção dos juízes antes do prazo.

## 5. O que foi testado

| Teste | Onde | Resultado | Data |
|---|---|---|---|
| Typecheck, 16 testes unitários, build de produção | PC | Passam | 2026-11-17 |
| Round-trip da âncora (refresh e reabrir: painéis no mesmo lugar, "Âncora: ativa (restaurada)", valores mantidos) | Quest 3S e emulador | Passou (relatado pelo usuário) | 2026-11-17 |
| App abre no Quest pela rede local e por aura-dev | Quest 3S | Funciona (relatado pelo usuário) | 2026-11-17 |
| Cursor e pinch (modo Leve) | Quest 3S | "Funcionando perfeitamente" (relatado pelo usuário) | 2026-11-17 |
| HUD "Follow my view" | Quest 3S | Funciona com o atraso esperado; a folga lateral pedida foi aplicada (**não verificado** depois do ajuste) | 2026-11-17 |
| Configurações (engrenagem, seções, idioma, tamanho, opacidade, telemetria, renomear, testar, Project phases) | Emulador (IWER, perfil Quest 3) | Funcionam | 2026-11-17 |
| Os 4 endereços servem o código certo (produção = Phase 1; aura-phase1; aura-phase2; aura-dev) | PC (HTTP) | Sim, com certificado válido | 2026-11-17 |
| Link de produção, "Abrir" uma fase e exportar JSON no Quest | — | **Não verificado** | — |

## 6. Decisões tomadas

- **WebXR / IWSDK em vez do caminho nativo** (Meta Spatial SDK, com Unreal como protótipo): mantém o projeto viável no prazo e preserva a ideia central; os juízes abrem um link (`README.md`, rascunho do Devpost).
- **AprilTag em vez de QR code:** o tag carrega só o id; o significado do dispositivo vive no app (`docs/apriltag-markers.md`).
- **IDs 1, 2 e 3**, sem o 0, porque o gerador do RealityScan Desktop começa no 1.
- **MVP com dispositivos simulados (`sim://`)**, com o caminho para dispositivos reais via Matter (`matter://`) sem mudar os painéis.
- **Vercel com domínio próprio**, ligação com o GitHub desligada e deploy manual a partir de uma cópia sem `.git` (o plano Hobby recusa o autor do commit).
- **Fases congeladas por tag, cada uma no próprio endereço**, em vez de trocar de fase dentro de um app só: cada fase é um código diferente. Trocar de página encerra a sessão XR.
- **Local-first:** configurações e calibração só no headset, sem nuvem.
- **Pinch ativando no início do gesto (modo Leve) por padrão:** o clique da biblioteca de ponteiros só conta abaixo de 300 ms (`src/ui/activation.ts`).
- **Renomear por sugestões:** não há teclado dentro da sessão imersiva.
- **Deeper Mode = tema holograma ciano** (referências em `docs/ux/hud-reference/`), planejado para a Phase 4.

## 7. Bloqueios e pendências

- **Prazo da submissão:** quarta, 18/nov/2026, 12:00 PT (fonte: `../CONTEXT.md`, fora do repositório). Faltam decidir a versão de produção, publicá-la, gravar o vídeo e submeter.
- **Regra da competição:** depois do prazo, o app publicado não pode mudar até o resultado.
- **Produção ainda na Phase 1:** o "What it does" do Devpost descreve a Phase 1 e deve acompanhar a versão que for publicada.
- **Cabo USB:** o Quest aparece como "unauthorized" no `adb`; os testes seguem pela Wi-Fi. O serviço do Meta Horizon Link está parado no PC até reiniciá-lo.
- **Tamanho real dos tags impressos:** ainda não medido (campo em `docs/apriltag/README.md`).
- **README e guia em PDF:** a parte de interface ainda descreve a Phase 1.

## 8. Próximos passos

1. Decidir a fase da produção dos juízes e publicar (`npm run deploy`); testar o link no Quest.
2. Phase 3: testar a câmera dentro da sessão XR e implementar a leitura dos tags colados no cômodo.
3. Atualizar o "What it does" do Devpost, gravar o vídeo e submeter.
4. Medir o lado real dos tags impressos e anotar em `docs/apriltag/README.md`.
5. Atualizar a parte de interface do README e o guia em PDF.

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
| `src/phases/phases.ts` | Registro das fases do projeto (endereços, datas, fase atual) |
| `tests/unit.test.ts` | Testes unitários (16) |
| `tools/` | Geradores (stickers, guia PDF, PDFs da submissão, certificado LAN) e deploys na Vercel |
| `docs/apriltag/` | Marcadores para imprimir e notas de impressão |
| `docs/dev-notes/` | Notas de sessão: PROGRESS, RESUME, logs |
| `docs/submission/` | Roteiro do vídeo e rascunho do Devpost (PDF) |
| `docs/ux/` | Referências: Quest, HUD, som, especificação do painel |
| `docs/journey/` | Registro da evolução (screenshot da Phase 1) |

---

## Histórico de versões deste status

- **2026-11-17, terceira versão** — Fases congeladas por tag (Phase 1 e Phase 2, cada uma no próprio endereço) e menu Project phases no app; marcos definidos até a Phase 5; termos "Phase" em inglês; marcadores guardados em `docs/apriltag/`, impressos e colados no cômodo; produção ainda na Phase 1.
- **2026-11-17, segunda versão** — Commit `c22daaa` com todo o trabalho pendente; cursor e pinch verificados no Quest; som novo; rascunho do Devpost com Visão, enquadramento de MVP e troca de stack; README com a hospedagem correta.
- **2026-11-17** — Primeira versão (linha de base). Phase 1 publicada e marcada; interface estilo Quest, HUD, Configurações em 6 seções e i18n em 5 idiomas no aura-dev, ainda sem commit.
