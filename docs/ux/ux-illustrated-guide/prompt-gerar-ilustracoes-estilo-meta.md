# A.U.R.A. — Prompt para gerar ilustrações no mesmo estilo das do Concept 1

Fonte das 3 ilustrações originais: `workspace/your_files/a-u-r-a-landing-page/a-u-r-a-landing-page.html` (Concept 1, 17/nov/2026)
Estilo aplicado na época (verificado em memória): fundo claro #F0F2F5, azul Meta #0082FB nos botões pill / links / destaques, tipografia sans limpa, ilustrações flat azul-e-branco, faixa de persistência em gradiente azul.

## As 3 ilustrações originais

1. **01-sala-headset-controles-flutuantes.webp** — 2048×1152 (16:9)
   Hero / "The idea in one picture". Sala clara, pessoa no sofá com headset de realidade mista, cards de controle com borda azul flutuando sobre a lâmpada, o ar-condicionado e a porta da frente.
2. **02-sala-dia-e-noite-ancoras-persistentes.webp** — 2736×912 (3:1, díptico)
   Mesma sala de dia e de noite, lado a lado, com os cards de controle (lâmpada, ar, porta) exatamente nas mesmas posições nas duas metades — persistência das âncoras.
3. **03-oculos-inteligentes-corredor-porta.webp** — 1920×1280 (3:2)
   "The glasses chapter". Pessoa de perfil com óculos inteligentes comuns, no corredor de casa, de frente para a porta, com um único card pequeno de borda azul flutuando ao lado dela.

## Prompt-mestre (em inglês — copiar e colar no gerador de imagens)

```
Flat vector illustration in the Meta / Facebook illustration style, clean and minimal, for a smart-home app landing page. Soft light background #F0F2F5, almost white. Palette limited to Meta blue #0082FB, soft greys (#E8EAED, #C9CDD3, #9AA0A6), white, and one warm skin tone for the person. Flat shapes, no gradients except a very soft blue glow on the floating UI cards, no photorealism, no 3D render look, no shadows except a soft flat floor shadow, no text except simple line icons inside the UI cards. Calm, friendly, spacious composition with lots of negative space. Wide 16:9 landscape format.

[DESCRIÇÃO DA CENA AQUI — ver variações abaixo]

Floating UI: small white rounded-rectangle control cards with a thick Meta-blue #0082FB outline, floating just above each device they control, each with a single simple blue line icon inside (sun / slider for the lamp, snowflake / fan for the air conditioner, lock / door / bell for the front door). The cards are the only saturated blue elements in the scene.
```

## Variações — troque só a [DESCRIÇÃO DA CENA]

**A) Sala com headset (igual à 01):**
```
Scene: a bright modern living room, a relaxed person sitting on a light-grey sofa wearing a white mixed-reality headset, legs crossed. To the left a tall floor lamp, on the wall a white split air conditioner, to the right a closed front door with a small potted plant beside it.
```

**B) Dia e noite, âncoras persistentes (igual à 02):**
```
Scene: a split diptych of the exact same living room, left half in bright daylight, right half at night with the lamp glowing warm. Sofa, floor lamp, window, air conditioner and front door are in exactly the same positions in both halves. The floating control cards are in exactly the same positions in both halves.
```

**C) Óculos inteligentes no corredor (igual à 03):**
```
Scene: a person in profile wearing slim everyday smart glasses with a thin blue temple, standing in a bright home hallway facing a closed front door, a small potted plant in the corner. One single small floating control card beside the door.
```

**D) Nova cena no mesmo estilo (para o manual das AprilTags):**
```
Scene: [descreva a ação em uma frase, ex.: a person printing a sheet of black-and-white square fiducial markers on a home printer, holding the printed sheet up on a white living-room wall next to a lamp]
Keep the same room, the same person, the same palette, and the same floating blue-outlined cards.
```

## Prompt negativo / o que evitar

```
No photorealism, no 3D render, no Pixar style, no anime, no dark background, no neon, no extra colors, no red, no green except a small muted plant, no text, no letters, no numbers, no logos, no watermark, no QR code, no clutter, no busy pattern.
```

## Dicas para manter a consistência
- Gere sempre com a imagem 01 anexada como referência de estilo, quando o gerador permitir ("use this image as style reference").
- Mantenha os cards sempre brancos, com borda grossa #0082FB e só um ícone de linha azul dentro — é isso que faz o conjunto parecer da mesma família.
- Se o gerador embaralhar ícones ou colocar texto, gere de novo pedindo "simple line icons only, no text".
- Para o manual das AprilTags, peça fundo branco puro (#FFFFFF) em vez de #F0F2F5, para imprimir bem.
