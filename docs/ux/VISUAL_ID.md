# Identidade visual do A.U.R.A. (tokens)

Fonte única das cores e regras visuais do ecossistema A.U.R.A.: o app no Quest, a landing page, o Devpost, os PDFs e os vídeos. Quem fizer uma peça nova usa estes valores, não cores escolhidas a olho.

**Origem:** os concept boards de 17/11/2026 em [`docs/ux/user-interface-refs/`](user-interface-refs/), alinhados à imagem do post no Devpost:

- `1-concept-board-aura.jpeg`: a cena (alvo de pinch, nós de dispositivo, slider vertical, sala em wireframe);
- `1-concept-board-visual-id-color-palette-design-tokens.jpeg`: paleta, estados repouso/ativo, elementos, ícones;
- `2-concept-board-uiux-components.jpeg`: componentes (botões, sliders, dials, sala isométrica).

As referências anteriores (estilo cinza do Horizon OS) foram para `user-interface-refs/archived-refs/`.

Os valores abaixo foram **amostrados dos pixels** dos boards (17/11), não estimados.

## Regra principal: ciano repousa, âmbar age

| Estado | Cor | Uso |
|---|---|---|
| **Repouso** (disponível, desligado, informação) | ciano | ícones, contornos, sliders parados, wireframes, cursor |
| **Ativo** (ligado, selecionado, sob o dedo, confirmando) | âmbar | dispositivo ligado, botão primário, item selecionado, snap do cursor |

A transição de um para o outro é um degradê ciano → âmbar (board de tokens, linha "RESTING … ACTIVE").

## Tokens de cor

| Token | Hex | Onde aparece nos boards | Uso no app |
|---|---|---|---|
| `bg-deep` | `#1b2e3f` | fundo da cena | superfície das janelas e barras |
| `bg-canvas` | `#253544` | fundo dos boards | fundo de página (landing) |
| `surface-raised` | `#2f4052` | painéis de vidro | botões secundários, trilhos, itens da nav |
| `surface-glass` | `#466077` | topo iluminado do vidro | realce do vidro (degradê) |
| `border-glass` | `#4e7089` | borda dos painéis | borda fina de janelas e barras |
| `cyan` | `#62e2ef` | círculo "RESTING", sliders ciano | repouso: status, ícones, contornos, cursor |
| `cyan-dim` | `#478091` | anéis e traços apagados | cantoneiras, linhas secundárias, wireframe |
| `amber` | `#ffb850` | círculo "ACTIVE", sliders âmbar | ativo: botão primário, ligado, selecionado |
| `text` | `#e9f2f9` | títulos dos boards | texto principal |
| `text-muted` | `#8fb3c4` | legendas pequenas | texto secundário (âncora, descrições) |
| `text-on-amber` | `#14222e` | — | texto sobre fundo âmbar |
| `danger` | `#ff8a80` | — (não aparece nos boards) | só confirmações destrutivas (apagar dados) |

## Forma e acabamento

- **Vidro:** painéis translúcidos azul-petróleo com borda fina clara (`border-glass`); cantos arredondados médios.
- **Cantoneiras de HUD:** quatro cantos em L finos (`cyan-dim`) em volta de painéis e alvos.
- **Brilho:** ciano e âmbar têm halo (glow); o resto é fosco.
- **Alvos de gesto:** anéis concêntricos ciano em repouso; viram âmbar com ponto central quando ativos.
- **Wireframe:** a sala e os móveis em linhas ciano finas; dispositivos ativos como pontos âmbar com halo.
- **Microdetalhes:** grades de pontos, códigos de barra e textos minúsculos como decoração (só em telas grandes; no Quest, com moderação, porque não ficam legíveis).
- **Fonte:** Inter (já usada no app, com acentos).

## Aplicação

| Peça | Estado |
|---|---|
| App (Quest) | Paleta aplicada em 17/11 (Phase 3): janelas, barras, botões, Configurações, cursor. Brilho, cantoneiras e anéis ficam para depois (Phase 4, Deeper Mode). |
| Landing page | Feita pela Lola, com estes tokens. |
| Devpost, PDFs | A imagem do post já segue a direção. |
