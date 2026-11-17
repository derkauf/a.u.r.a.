# Log de sessão: 2026-11-17 - Instalação da metodologia de sessão (dev notes)

**Data:** 2026-11-17
**Branch / versão:** sem git (a pasta veio de um export do Google Drive)
**Objetivo:** instalar neste projeto a metodologia `/devlog` + `/resume`, usada no Build-World.

---

## 1. Perguntas e contexto

- **P1:** Instalar a metodologia `/devlog` no `aura-v1-lola-paralela`.
  - **Contexto:** as skills `/devlog` (`/encerrar`) e `/resume` (`/retomar`) já estão instaladas no nível do usuário (`~/.claude/skills`, fonte em `derkauf/dev-journey`). Para funcionarem num projeto, ele precisa das dev notes e da linha `Dev notes:` no `CLAUDE.md`.

---

## 2. Decisões

| Decisão | Alternativas consideradas | Por quê |
| :--- | :--- | :--- |
| **As dev notes ficam em `docs/dev-notes/`** | `documentation/dev-notes/`, `dev-notes/` na raiz | O projeto já tem `docs/` (AprilTags, UX). É o padrão sugerido pelo kit. |
| **Escritas em português** | Inglês, como os templates do kit | O README, o `memory.md` e os docs do projeto estão em português. |
| **O `memory.md` fica onde está**, linkado como log do build inicial | Movê-lo para `chat-logs/` | Ele é referenciado pelo README e pelo upload no Drive. Os próximos logs vão para `chat-logs/`. |
| **As regras de sessão foram acrescentadas ao `CLAUDE.md`**, mantendo o `@AGENTS.md` | Um arquivo separado | É o `CLAUDE.md` que as skills leem para achar `Dev notes:` e `Session repos:`. |

### Notas de implementação

- **Verificado:** a estrutura foi criada e os links relativos apontam para arquivos que existem.
- **Não verificado:** as mudanças de 16/11 (idioma, configurações, fonte, certificado LAN). Elas não têm registro, e o estado do código não foi checado nesta sessão.

---

## 3. Arquivos adicionados, alterados ou removidos

```text
[M] CLAUDE.md                                  (regras de sessão e linha Dev notes)
[A] docs/dev-notes/PROGRESS.md
[A] docs/dev-notes/RESUME.md
[A] docs/dev-notes/chat-logs/2026-11-17-instalacao-dev-notes.md
[A] docs/dev-notes/changelog/README.md
[A] docs/dev-notes/templates/DEVLOG_TEMPLATE.md
```

**Commits:** nenhum (a pasta não é um repositório git).

---

## 4. Relatos e tickets externos

| Id | Assunto | Estado |
|---|---|---|
| — | — | — |

---

## 5. Próximos passos

1. Registrar as mudanças de 16/11 (ver PROGRESS › Agora).
2. `npm run typecheck` e `npm run test:unit`.
3. O round-trip da âncora: `tests/anchor-roundtrip.md`.

---

## 6. Documentos derivados (só relato)

- `README.md` e `a.u.r.a.-by-lola-guia-inicial.pdf` (gerado por `tools/generate-guia-pdf.py`): não sabemos se cobrem as mudanças de 16/11 (seletor de idioma, configurações, certificado LAN).

---
---

# Parte 2: Primeira execução, fonte com acentos, inglês + pt-BR e acesso pelo Quest

**Data:** 2026-11-16 a 2026-11-17 (uma sessão contínua; é a sessão que fez as "mudanças de 16/11" citadas acima)
**Branch / versão:** sem git
**Objetivo:** rodar o projeto pela primeira vez nesta máquina e corrigir o que aparecesse; depois, interface em inglês com seletor de pt-BR e acesso pelo Quest na Wi-Fi.

---

## 1. Perguntas e contexto

- **P1:** `npm install`, `npm run typecheck`, `npm run dev`.
  - **Contexto:** primeira execução depois do download do Google Drive. O npm bloqueou os scripts de instalação de 4 pacotes; o usuário aprovou só o do `esbuild` (`npm install-scripts approve esbuild`). O npm também relatou 3 vulnerabilidades altas, não tratadas.
- **P2:** O Scene Editor abriu com `Failed to load asset "sticker-lamp" ... returned HTML`.
  - **Contexto:** o usuário suspeitava de download incompleto ou de o editor ter aberto antes do servidor. A causa era outra: os 7 arquivos de `public/ui/` vieram como `*.uikitml.html`; o download do Drive acrescentou `.html`. O Vite devolvia a página fallback.
- **P3:** Investigar os avisos `Missing glyph info for character` e os "acentos quebrados".
  - **Contexto:** os arquivos estão em UTF-8 correto; o `Â` era de "CÂMERA"/"Âncora". A causa era a fonte: as 17 fontes MSDF do `@pmndrs/msdfonts` têm 104 glifos (só ASCII e alguns símbolos). "Lâmpada" aparecia como "L▪mpada".
- **P4:** Usar a Inter e colocar o projeto todo em inglês, com seletor de pt-BR num menu de configurações.
  - **Contexto:** o app não tinha menu de configurações.
- **P5:** Qual o endereço para acessar? Não abre no Quest nem no celular pela Wi-Fi.
  - **Contexto:** sem `https://`, o Chrome tenta `http://` e mostra "This page isn't working". Com `https://`, o aviso de certificado não tinha "Advanced": o certificado do IWSDK só cobre `localhost` e tem um SAN malformado (`DNS:[::1]`).
- **P6:** Ir pelo cabo USB (`adb reverse`).
  - **Contexto:** o cabo do usuário está quebrado. Ficou para quando o cabo novo chegar.
- **P7:** A janela gerenciada do IWSDK precisa ficar aberta?
  - **Contexto:** não. O servidor roda separado dela; ela só serve para inspeção e controle pelo CLI.
- **P8:** No Quest a cena fica estática, as tags fixas, sem passthrough. Como abrir o editor de XR no Quest?
  - **Contexto:** o IWER (emulador) não é injetado no Quest Browser (`userAgentException: /OculusBrowser/`), então o Quest usa WebXR nativo. O passthrough só liga depois de tocar em **Enter XR**. Os stickers são simulados na v1 (sem detecção de câmera), por isso ficam fixos. O editor de cenas é só do PC ("host-only").

---

## 2. Decisões

| Decisão | Alternativas consideradas | Por quê |
| :--- | :--- | :--- |
| **Renomear os 7 `*.uikitml.html` para `*.uikitml`** | Baixar a pasta de novo; mudar o manifesto | O conteúdo estava íntegro; o manifesto (`BASE_URL + ui/`) estava certo. |
| **Gerar a fonte em código (`src/ui/aura-font.ts`) com `UIKit.TTFLoader` e charset latino completo**, aplicada via `fontFamilies` na raiz de cada painel | `@font-face` no UIKitML; trocar por outra fonte MSDF do pacote | O `@font-face` do UIKitML chama o `TTFLoader` sem `charset`, e o padrão é só ASCII. Todas as fontes MSDF do pacote têm o mesmo conjunto de 104 glifos. |
| **A Inter vem do Fontsource (`@fontsource/inter@5.2.5`, subset latin)**, pesos 400 e 700, com a licença OFL | O TTF variável do Google Fonts; o zip completo do rsms/inter | O subset latin cobre Latin-1 e a pontuação (`—`, `•`, `…`), tem ~67 KB por peso e uma URL com versão fixa. |
| **As gerações MSDF são serializadas e extraídas como o UIKitML faz** | Gerar em paralelo; passar o resultado direto | O `TTFLoader` devolve um registro de famílias, não a fonte; e gerações paralelas produzem atlas incompletos (aviso do próprio UIKitML). Sem isso, nenhum texto aparecia. |
| **Inglês como padrão, pt-BR selecionável; a escolha fica no `localStorage` (`aura_locale`)** | Seguir o idioma do navegador | Pedido do usuário. |
| **Só os textos da interface foram traduzidos.** Comentários e docs continuam em português | Traduzir também o código e os docs | Escopo ambíguo; ficou como pergunta em aberto para o usuário. |
| **Painel novo `settings` acima dos stickers** (`[0, 1.86, -0.6]`, escala 0.1) | Painel lateral; HUD | Região livre e central na vista padrão; mesma escala dos outros painéis. |
| **Os botões de idioma são `div` clicáveis**, não `<Button>` do Horizon | `<Button>` com `setProperties({ backgroundColor })` | O `<Button>` do kit ignorava a cor definida em tempo de execução; o idioma ativo ficava quase branco com texto branco. |
| **O UIKitML guarda o texto em inglês e ganha `id` nos textos fixos**; `AuraLocalizationSystem` sobrescreve em tempo de execução | Gerar o UIKitML por idioma | Um arquivo por painel; o preview do editor mostra inglês. |
| **Certificado próprio para a LAN (`npm run cert:lan`)**, lido pelo `vite.config.ts` quando existe | Opção `iwsdkDev({ https: { domains } })`; túnel público (Cloudflare/ngrok) | O `domains` do plugin grava tudo como DNS, e o navegador não compara IP com DNS. O túnel publicaria o app na internet. |
| **O teste no Quest pelo cabo ficou para depois** | — | O cabo do usuário está quebrado. |

### Notas de implementação

- **Trade-offs:** a fonte é gerada em tempo de execução (MSDF via WebAssembly, uma vez por peso) e não no build. O preview do Editor não roda sistemas, então lá os painéis usam a fonte padrão (faltam `—` e `•` nos textos em inglês).
- **Dependências adicionadas:** nenhum pacote npm. Arquivos de fonte Inter (OFL) em `public/fonts/`.
- **Verificado** (no emulador IWER, perfil Quest 3, pelo CLI do IWSDK):
  - `npm run typecheck` limpo; `npm run test:unit` 12 de 12; `npm run build` passa (só o aviso de chunk acima de 500 kB).
  - Console com 0 erros e 0 avisos `Missing glyph`.
  - Seletor de idioma com o raio do controle, nos dois sentidos: Settings/Configurações, "Lâmpada da sala", "Ler tag"/"Scan tag", status "Desligada"/"Off", "Ligar"/"Turn on", a linha da âncora.
  - A escolha de idioma sobrevive ao reload da página.
  - O servidor entrega o certificado novo em `https://192.168.1.218:8081/` (SAN: `localhost`, `127.0.0.1`, `192.168.1.218`).
  - O usuário confirmou que a página abre no celular e no Quest pela Wi-Fi.
- **Escrito, mas não verificado:**
  - O passthrough no Quest depois de **Enter XR**: o usuário relatou cena estática e sem passthrough; ainda não se sabe se ele tocou em Enter XR.
  - Qualquer interação no headset real.
  - O round-trip da âncora (continua pendente).

### Fora do escopo, só registrado

- Nos 3 stickers, o nome do dispositivo fica cinza escuro sobre fundo escuro: o `<Panel>` do Horizon desenha a superfície escura por cima do `background-color: #ffffff` do sticker. Já era assim antes desta sessão.
- 3 vulnerabilidades altas relatadas pelo `npm audit`; scripts de instalação ainda bloqueados para `onnxruntime-node`, `protobufjs` e `@meta-quest/metavr`.

---

## 3. Arquivos adicionados, alterados ou removidos

```text
[M] public/ui/camera-placeholder.uikitml   (era .uikitml.html; texto em inglês + ids)
[M] public/ui/panel-ac.uikitml             (idem)
[M] public/ui/panel-lamp.uikitml           (idem)
[M] public/ui/panel-lock.uikitml           (idem)
[M] public/ui/sticker-ac.uikitml           (idem)
[M] public/ui/sticker-lamp.uikitml         (idem)
[M] public/ui/sticker-lock.uikitml         (idem)
[A] public/ui/settings.uikitml             (painel Settings / seletor de idioma)
[A] public/fonts/Inter-latin-400.ttf
[A] public/fonts/Inter-latin-700.ttf
[A] public/fonts/LICENSE-Inter.txt
[A] src/i18n/i18n.ts                       (textos en / pt-BR, locale persistido)
[A] src/ui/localization-system.ts          (textos fixos, fonte, botões de idioma)
[A] src/ui/aura-font.ts                    (Inter com charset latino via TTFLoader)
[M] src/ui/device-panel-system.ts          (status e botões via t(); reage à troca)
[M] src/anchors/anchor-status.ts           (linha da âncora via t())
[M] src/index.ts                           (registra AuraLocalizationSystem)
[M] src/assets.ts                          (asset settings; nomes em inglês)
[M] public/scenes/main.iwsdk.scene.json    (nó settings; nomes em inglês)
[A] tools/generate-lan-cert.mjs            (certificado com o IP da LAN)
[M] vite.config.ts                         (usa .iwsdk/https-lan/ quando existe)
[M] package.json                           (script cert:lan; esbuild aprovado)
```

Fora do repositório (git-ignorado): `.iwsdk/https-lan/key.pem` e `cert.pem`.

**Commits:** nenhum (a pasta não é um repositório git).

---

## 4. Relatos e tickets externos

| Id | Assunto | Estado |
|---|---|---|
| — | — | — |

---

## 5. Próximos passos

1. No Quest, abrir `https://192.168.1.218:8081/`, tocar em **Enter XR** e confirmar o passthrough; se não aparecer, anotar o que acontece (botão, erro, fundo preto).
2. Quando chegar o cabo USB-C de dados: `adb reverse` e o fluxo da skill `iwsdk-native-xr-test`.
3. Decidir com o usuário se comentários e docs também vão para o inglês.
4. O round-trip da âncora: `tests/anchor-roundtrip.md`.

---

## 6. Documentos derivados (só relato)

- **`README.md`:** desatualizado.
  - Cita "Ler tag" e os nomes em português como texto da interface; o padrão agora é inglês ("Scan tag").
  - Não menciona o painel Settings nem o seletor de idioma.
  - A seção de acesso pelo Quest (linhas ~74–76) diz para aceitar o aviso de certificado, sem `npm run cert:lan` e sem avisar que é preciso digitar `https://`.
  - A pendência "glifos `°C`, `ã`, `ç`" (linha ~165) está resolvida.
- **`a.u.r.a.-by-lola-guia-inicial.pdf`** (gerado por `tools/generate-guia-pdf.py`): os mesmos pontos ("Ler tag", certificado, a pendência dos glifos na linha 221 do gerador).

---
---

# Parte 3: Repositório no GitHub e round-trip da âncora

**Data:** 2026-11-17
**Branch / versão:** `main`, commit inicial `dd91fcc`
**Objetivo:** publicar o projeto num repositório próprio e registrar o primeiro teste do guia.

---

## 1. Perguntas e contexto

- **P1:** Criar um repositório no GitHub do usuário com o nome `aura-v1-lola`.
  - **Contexto:** a pasta não era um repositório git (veio de um export do Google Drive).
- **P2:** O usuário seguiu o item 4 do `a.u.r.a.-by-lola-guia-inicial.pdf` (round-trip da âncora, `tests/anchor-roundtrip.md`) e relatou o resultado.

---

## 2. Decisões

| Decisão | Alternativas consideradas | Por quê |
| :--- | :--- | :--- |
| **Repositório privado** (`derkauf/aura-v1-lola`) | Público | O usuário não especificou; privado é reversível e não expõe nada. |
| **Um commit inicial com tudo**, menos o que o `.gitignore` exclui | Vários commits por tema | Não havia histórico para preservar. |

### Notas de implementação

- **Verificado:** antes do commit, os 145 arquivos foram revisados: sem `.pem`, `.env`, `node_modules`, `dist` ou `.iwsdk/`; uma busca por padrões de token e senha não achou nada. O repositório foi confirmado como `PRIVATE`, com `main` acompanhando `origin/main`.
- **Relatado pelo usuário (não observado pelo agente):** o round-trip da âncora **passou no Quest (Wi-Fi, sessão XR real) e no PC (emulador)**. Depois de refresh e de fechar e reabrir o app, os painéis voltaram **no mesmo lugar**, com "Âncora: ativa (restaurada)", e os valores alterados persistiram. É o critério de pronto da v1 definido no PROGRESS.
- **Consequência:** a pendência da Parte 2 sobre o passthrough no Quest fica resolvida na prática: o teste rodou numa sessão XR do headset.

---

## 3. Arquivos adicionados, alterados ou removidos

```text
[A] .git/                                   (repositório inicializado; remoto origin)
[M] docs/dev-notes/PROGRESS.md
[M] docs/dev-notes/RESUME.md
[M] docs/dev-notes/chat-logs/2026-11-17-instalacao-dev-notes.md
```

**Commits:** `dd91fcc` Initial commit: A.U.R.A. v1 (parallel build by Lola). As atualizações das dev notes desta parte ainda não foram commitadas.

---

## 4. Relatos e tickets externos

| Id | Assunto | Estado |
|---|---|---|
| — | — | — |

---

## 5. Próximos passos

1. Comparar com `derkauf/a.u.r.a.` e anotar as diferenças.
2. Os dois itens não verificados do build inicial (PROGRESS › Próximos).
3. Decidir o escopo da tradução e atualizar o README e o guia em PDF.

---

## 6. Documentos derivados (só relato)

- **`README.md` e o guia em PDF:** além dos pontos da Parte 2, a seção "7. O que eu não consegui baixar ou verificar" do guia (linha ~219 do gerador) diz que o round-trip não rodou. Agora ele passou no Quest e no PC.


---
---

# Parte 4: Submissão, Phase 2 (HUD estilo Quest, Configurações, pinch confiável) e fases congeladas

**Data:** 2026-11-17
**Branch / versão:** `main`; commits `e2c56e2`, `dc82aa3`, `c22daaa`, `86ff8b4`; tags `phase-1` (`dc82aa3`) e `phase-2` (`86ff8b4`)
**Objetivo:** preparar a submissão (prazo 18/11, 12:00 PT), publicar o app, refazer a interface no estilo do Horizon OS, tornar o pinch confiável e preservar cada fase do projeto.

---

## 1. Perguntas e contexto

- **P1:** Trocar os IDs dos tags para começar em 1. *Contexto:* o gerador do RealityScan Desktop começa no 1.
- **P2:** Próxima etapa e submissão. *Contexto:* `../CONTEXT.md` (fora do repo) fixa o prazo do Devpost em 18/11, 12:00 PT. O usuário decidiu que a comparação com `derkauf/a.u.r.a.` sai do plano e o trabalho segue neste repo.
- **P3:** Publicar em `aura.sixvectors.app`. *Contexto:* domínio e DNS já na Vercel do usuário.
- **P4:** Roteiro do vídeo e rascunho do Devpost em PDF. Depois, incluir:
  - a visão (o tag representa o dispositivo IoT; o A.U.R.A. é a ponte por API);
  - a seção "Vision";
  - o enquadramento de MVP;
  - a frase exata sobre a troca de stack.
- **P5:** Interface no estilo do Quest (referências em `docs/ux/quest-reference/`):
  - cards como ícones de app, com hover;
  - estado inicial só com os ícones;
  - janela com X;
  - engrenagem, "Quit" e "Follow my view" (HUD).
- **P6:** Configurações completas em 6 seções e i18n por arquivos com 5 idiomas (especificação do usuário). Núcleo primeiro, por causa do prazo.
- **P7:** "O pinch e o snap não clicam direito." *Contexto:* testado no Quest pela Wi-Fi.
- **P8:** Cabo USB e Quest Link. *Contexto:* o Quest ficou "unauthorized" no `adb`, e o Meta Horizon Link capturava o headset.
- **P9:** Guardar cada fase do projeto e poder escolhê-la num menu do app. Termos "Phase" em inglês. Guardar o PDF dos marcadores para impressão.
- **P10:** Status para a Lola (`docs/STATUS_PARA_LOLA.md`).

---

## 2. Decisões

| Decisão | Alternativas consideradas | Por quê |
| :--- | :--- | :--- |
| **IDs 1, 2 e 3; o 0 não é usado** | Manter 0–2 | O gerador do RealityScan Desktop começa no 1. |
| **Vercel, com domínio próprio** (`aura.sixvectors.app`) | GitHub Pages; túnel | O DNS já estava na Vercel; HTTPS válido, sem aviso no Quest. |
| **Deploy de uma cópia sem `.git`** (`npm run deploy`) | Plano Pro; trocar o e-mail do git | No plano Hobby, a Vercel bloqueia o deploy quando o autor do commit (`diogo@sixvectors.com`, configuração global do git) não tem conta Vercel. |
| **Ligação Vercel ↔ GitHub desligada** | Deploy automático a cada push | Evita deploys bloqueados e protege o app depois do prazo (a regra exige o app sem mudanças). |
| **Ambiente `aura-dev.sixvectors.app`** (projeto separado) | Testar só pelo cabo ou pela LAN | Teste no Quest sem cabo e sem tocar no oficial. |
| **Interface estilo Horizon OS:** ícone de app com o tag, nome embaixo, janela com barra e X, engrenagem | Cards com botão | Pedido do usuário, a partir dos screenshots do Quest. |
| **HUD próprio** (`hud-follow-system.ts`), limites de 50° na horizontal e 40° na vertical | `Follower` do IWSDK (só gira no eixo vertical e tem um limite único) | Era preciso folga lateral para olhar os ícones 1 e 3, e seguir para cima e para baixo. |
| **Configurações: núcleo primeiro** | Tudo de uma vez | Prazo. O resto (Deeper Mode, temas, áudio espacial, importar JSON) ficou para depois e virou a Phase 4. |
| **Deeper Mode = tema holograma ciano** | Indefinido | Referências em `docs/ux/hud-reference/`. |
| **Renomear por sugestões** | Teclado do sistema | Não há teclado dentro da sessão imersiva. |
| **Pinch "Leve" por padrão, ativando no início do gesto** (`src/ui/activation.ts`) | Clique padrão | A biblioteca `@pmndrs/pointer-events` só emite `click` se apertar e soltar acontecerem em menos de 300 ms e no mesmo elemento. O pinch real dura mais e desloca o raio. |
| **Cursor no ponto real do raio** (`event.point`), com snap ajustável | Snap no centro do painel inteiro | O cursor antigo mostrava um lugar diferente de onde o clique caía. |
| **Fases congeladas:** tag `phase-N` → `https://aura-phaseN.sixvectors.app/` (`npm run deploy:phase`), com menu "Project phases" no app | Trocar de fase dentro de um app só | Cada fase é um código diferente; publicar a tag preserva a evolução sem misturar código. Trocar de página encerra a sessão XR (limite do WebXR). |
| **Marcos:** Phase 1 = tags simulados; Phase 2 = HUD e Configurações; Phase 3 = leitura real pela câmera; Phase 4 = Deeper Mode, temas e áudio espacial; Phase 5 = dispositivos reais via Matter | — | Aprovados pelo usuário. |
| **"Phase" em inglês na documentação e no app**; tag `fase-1` → `phase-1` | "Fase" | Pedido do usuário. |
| **`.gitattributes` marcando binários** | — | O git trataria o PDF dos marcadores como texto e converteria as quebras de linha, corrompendo o arquivo. |

### Notas de implementação

- **Verificado no Quest (relatado pelo usuário):**
  - o app abre pela LAN e pelo aura-dev;
  - o HUD segue com o atraso esperado (ele pediu mais folga, já aplicada);
  - o hover está bom;
  - depois das correções, "cursor e pinch funcionando perfeitamente".
- **Verificado no emulador (IWER, pelo CLI):**
  - a engrenagem abre e fecha a janela, e as seções trocam;
  - idioma (Deutsch, Español), tamanho L (escala 0.125), opacidade, telemetria, renomear e testar dispositivo;
  - o HUD centraliza ao virar a cabeça 60° e fica na sala com o "Follow my view" desligado;
  - o "Quit" encerra a sessão;
  - o modo Média ativa ao soltar no painel;
  - a seção Project phases mostra os estados certos.
- **Verificado no PC:**
  - typecheck limpo e 16 de 16 testes unitários (4 novos: remover vínculo, limpar tudo, exportar/importar, limites do pinch);
  - build de produção ok;
  - os 4 endereços respondem com o código certo.
- **Descobertas:**
  - O UIKitML descarta texto só de espaço, e o elemento fica sem nó de texto. Por isso os resumos das fases e as linhas de feedback das Configurações nunca apareciam (corrigido no `86ff8b4`).
  - O servidor de dev caiu duas vezes: com um Ctrl+C às 05:40:35, no mesmo minuto de um `adb kill-server`, e depois às 05:54 sem causa registrada. Rodando como tarefa acompanhada (`npm run dev` em segundo plano), não caiu mais.
- **Escrito, mas não verificado:**
  - os limites do HUD depois do ajuste (50°/40°) e o alcance de ativação no headset;
  - exportar JSON no Quest Browser;
  - o link de produção no Quest;
  - a seção Project phases no headset e o "Abrir" de uma fase dentro do XR.
- **Dependências adicionadas:** nenhuma no app. Fora do repositório, num venv temporário: `fpdf2`, `pypdf`, `pypdfium2` e as fontes DejaVu, usados para gerar e verificar os PDFs.

---

## 3. Arquivos adicionados, alterados ou removidos

```text
[A] src/locales/{en,pt-BR,es,fr,de}.json               (um arquivo por idioma)
[M] src/i18n/i18n.ts                                   (carrega os arquivos; fallback inglês)
[A] src/settings/settings-store.ts, src/settings/room-config.ts
[A] src/devices/device-names.ts, src/devices/device-text.ts
[M] src/devices/device-registry.ts                     (unbind, unbindAll, exportar/importar)
[M] src/anchors/anchor-service.ts                      (solta o painel ao remover o vínculo)
[A] src/ui/settings-panel-system.ts, appearance-system.ts, activation.ts,
    feedback-sound.ts, hover-scale-system.ts, hud-follow-system.ts, view-follow.ts
[M] src/ui/localization-system.ts, src/ui/device-panel-system.ts
[M] src/input/hand-ray-cursor.ts                       (ponto real do raio, snap ajustável)
[A] src/phases/phases.ts                               (registro das fases)
[M] src/assets.ts, src/index.ts, src/markers/apriltag-handshake.ts
[M] public/ui/*.uikitml; [A] public/ui/settings-gear.uikitml, public/ui/telemetry.uikitml
[A] public/audio/ui-select.mp3                         (cópia de us-single-seam.mp3)
[M] public/scenes/main.iwsdk.scene.json
[M] tests/unit.test.ts
[M] tools/deploy-vercel.mjs (deploy, deploy:dev, deploy:phase)
[M] tools/generate-apriltag-stickers.py, tools/generate-guia-pdf.py
[A] tools/generate-submission-pdfs.py, docs/submission/aura-roteiro-video.pdf, docs/submission/aura-devpost-rascunho.pdf
[A] docs/apriltag/markers_Apriltag36h11_12counts_2pp.pdf, docs/apriltag/README.md
[A] docs/ux/quest-reference/, docs/ux/hud-reference/, docs/ux/sound-design/, docs/journey/phase-1-emulator.png
[A] docs/STATUS_PARA_LOLA.md
[M] README.md (hospedagem), docs/apriltag-markers.md, tests/anchor-roundtrip.md, a.u.r.a.-by-lola-guia-inicial.pdf
[M] package.json, .gitignore, .vercelignore; [A] .gitattributes
```

**Commits:**
- `e2c56e2`: IDs 1–3, PDFs da submissão, configuração da Vercel.
- `dc82aa3`: botão com o nome do dispositivo, visão IoT.
- `c22daaa`: HUD estilo Quest, Configurações, pinch confiável, i18n em 5 idiomas.
- `86ff8b4`: fases congeladas e menu Project phases.

**Fora do git:**
- Projetos na Vercel: `aura-v1-lola` (produção, ainda na Phase 1), `aura-v1-lola-dev`, `aura-v1-lola-phase-1` e `aura-v1-lola-phase-2`.
- A ligação da Vercel com o GitHub foi desligada.
- O serviço `OVRService` (Meta Horizon Link) foi parado no PC, a pedido do usuário. Ele volta ao reiniciar o PC.

---

## 4. Relatos e tickets externos

| Id | Assunto | Estado |
|---|---|---|
| E-mails da Vercel "Failed deployment" | Autor do commit sem conta Vercel (plano Hobby) | Resolvido: deploy por cópia sem `.git`, com a ligação ao GitHub desligada |

---

## 5. Próximos passos

1. Decidir qual fase vai para a produção dos juízes (`npm run deploy`) antes de 18/11, 12:00 PT, e testar no Quest.
2. Phase 3: leitura dos AprilTags pela câmera. Começar mudando `CURRENT_PHASE` para `phase-3` em `src/phases/phases.ts`.
3. Atualizar "What it does" no Devpost para a versão publicada, gravar o vídeo e submeter.
4. Atualizar `docs/STATUS_PARA_LOLA.md` com as fases congeladas.

---

## 6. Documentos derivados (só relato)

- **`README.md`:** a hospedagem está correta, mas a parte de interface ainda descreve a Phase 1 ("Ler tag", stickers, Settings só com o idioma). Faltam a interface estilo Quest, as Configurações, as fases congeladas e os comandos `deploy:dev` e `deploy:phase`.
- **`a.u.r.a.-by-lola-guia-inicial.pdf`** (gerado por `tools/generate-guia-pdf.py`):
  - ainda descreve a interface da Phase 1;
  - manda aceitar o aviso de certificado em vez de usar os endereços da Vercel;
  - a seção "7. O que eu não consegui verificar" diz que o round-trip não rodou, e ele já passou.
