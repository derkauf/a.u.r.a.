# A.U.R.A. v1 — Especificação do painel de dispositivo

## Um painel por dispositivo, três painéis na parede

| Dispositivo | Nó de cena | Arquivo UIKitML | Posição (m) |
|---|---|---|---|
| Lâmpada da sala | `panel-lamp` | `public/ui/panel-lamp.uikitml` | (-0,55; 0,95; -0,60) |
| Ar-condicionado da sala | `panel-ac` | `public/ui/panel-ac.uikitml` | (0; 0,95; -0,60) |
| Fechadura da porta | `panel-lock` | `public/ui/panel-lock.uikitml` | (0,55; 0,95; -0,60) |

Os stickers AprilTag ficam 55 cm acima de cada painel (y = 1,50, mesmo x e z).
O placeholder da câmera fica em (0; 0,95; -0,50) — 10 cm à frente do painel
do ar-condicionado, como um modal; começa escondido.

## Tamanho e distância

- Painel: 460 unidades UIKit de largura, escala 0,1 no nó → **0,46 m** de largura.
- Distância do usuário (origem da sessão): **0,60 m** — ao alcance da mão.
- Altura do centro do painel: 0,95 m (na altura do peito, sentado ou em pé).
- Os 3 painéis lado a lado ocupam 1,56 m de parede, com 9 cm de vão entre eles.
- O painel central (ar-condicionado) fica bem à frente do usuário ao entrar;
  os laterais exigem virar levemente a cabeça (cerca de 42°).

## Texto e alvos de toque

- Título: 32 (3,2 cm); status: 24 (2,4 cm); valor da faixa: 40 (4,0 cm).
- Botões: 72 de altura (7,2 cm) — bem acima do mínimo recomendado para pinch.
- Cores: fundo `#101418`, botão principal `#2A9D8F` (teal), botões de faixa
  `#2C3440`, texto de status `#7CFC9A`, linha da âncora `#8A94A6`.

## Estados do painel

| Estado | O que muda no painel |
|---|---|
| Não vinculado (tag ainda não lido) | Painel escondido (`display: none`) |
| Vinculado, dispositivo desligado | Status "Desligado" / "Desligada" / "Trancada"; botão "Ligar" / "Destrancar" |
| Vinculado, dispositivo ligado | Status com valor ("Ligado • 22°C", "Ligada • 80%"); botão "Desligar" |
| Fechadura destrancada | Status "Destrancada"; botão "Trancar" |
| Câmera aberta | Placeholder da câmera por cima do painel do ar-condicionado |

A linha da âncora em cada painel mostra: "aguardando sessão XR…",
"aguardando sessão XR (restaurar)", "ativa" ou "ativa (restaurada)".

## Controles por dispositivo (guiados pelo schema do descritor)

- **Lâmpada:** `power` (toggle) + `brightness` (faixa 0–100, passo 5).
- **Ar-condicionado:** `power` (toggle) + `setpoint_c` (faixa 16–30 °C, passo 1).
- **Fechadura:** `locked` (toggle) + `cam` (ação: abre a câmera simulada).

## Cursor

Anel branco na ponta do dedo indicador (repouso). Sobre um controle, o anel
gruda no centro do alvo (snap magnético), cresce 1,4× e fica âmbar.
Só aparece com sessão XR ativa.
