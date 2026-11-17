# A.U.R.A. v1 — Marcadores AprilTag

## O que é um AprilTag

Um AprilTag é um marcador fiducial visual: um quadrado preto-e-branco que
uma câmera identifica pelo seu **id numérico**. Foi criado pelo APRIL
Robotics Lab da Universidade de Michigan (Edwin Olson, ICRA 2011) e é o
padrão de fato em robótica, AR/VR e calibração de câmera — usado, entre
outros, pela FIRST Robotics e pelo robô Spot da Boston Dynamics.

Diferença para um QR code: o QR carrega dados (texto, URL, JSON); o
AprilTag carrega **só um id**. O significado do id vive no app — no caso
do A.U.R.A., a tabela local em `src/markers/apriltag-handshake.ts`.

## Família e ids da v1

- **Família: `tag36h11`** — 6×6 bits de dados, 587 códigos válidos, a
  família recomendada (a mesma da FIRST e do Spot). É o padrão; não trocar
  sem trocar também os tags impressos e a tabela no código.
- **Ids:** `1` = lâmpada da sala (`lamp-sala-01`), `2` = ar-condicionado
  (`ac-sala-01`), `3` = fechadura da porta (`lock-porta-01`).
- **O id `0` não é usado:** o gerador do RealityScan Desktop começa a
  numeração no 1 (o 0 fica reservado para reduzir falsos positivos).

## Os 3 descritores (o que cada tag resolve)

O tag resolve para um descritor de dispositivo — identidade, rótulo, tipo,
schema de controles e alvo de controle. Os 3 estão em
`src/markers/apriltag-handshake.ts` (`DEVICE_DESCRIPTORS`):

```json
{ "device_id": "lamp-sala-01", "label": "Lâmpada da sala", "type": "light",
  "controls": { "power": { "kind": "toggle" },
                "brightness": { "kind": "range", "min": 0, "max": 100, "step": 5 } },
  "bind": { "interaction": "on-device", "control_target": "sim://lamp-sala-01" } }
{ "device_id": "ac-sala-01", "label": "Ar-condicionado da sala", "type": "hvac",
  "controls": { "power": { "kind": "toggle" },
                "setpoint_c": { "kind": "range", "min": 16, "max": 30, "step": 1 } },
  "bind": { "interaction": "on-device", "control_target": "sim://ac-sala-01" } }
{ "device_id": "lock-porta-01", "label": "Fechadura da porta", "type": "lock",
  "controls": { "locked": { "kind": "toggle" }, "cam": { "kind": "action" } },
  "bind": { "interaction": "on-device", "control_target": "sim://lock-porta-01" } }
```

`control_target: sim://…` = dispositivo simulado (v1). Na v3, um plug real
seria `matter://<node-id>`, sem mudar o schema. O controle `cam` (ação) é
uma extensão v1 do schema: abre a câmera simulada, sem estado no dispositivo.

## Tags imprimíveis (para colar na parede)

### Opção A — RealityScan Desktop (gratuito, Epic Games)

1. Baixe em realityscan.com/download (instala pelo Epic Games Launcher,
   na aba RealityScan da seção Unreal Engine). Gratuito para estudantes,
   educadores e receita anual abaixo de US$ 1 milhão.
2. Abra um projeto → aba **Alignment** → ferramenta **Detect Markers** →
   gere os marcadores e exporte os **PDFs prontos para imprimir**.
3. Imprima os tags `tag36h11` de **id 1, 2 e 3**, um por dispositivo, e
   cole cada um no lugar do dispositivo (lâmpada, ar-condicionado, porta).
4. Imprima em tamanho real, sem redimensionar com interpolação, numa
   superfície plana e rígida — distorção e dobra degradam a detecção.

> Nota: o gerador do RealityScan também produz os marcadores circulares
> próprios dele (para fotogrametria). Se o menu da sua versão não mostrar
> AprilTag, use a Opção B — são os mesmos tags `tag36h11`, ids 1, 2 e 3.

### Opção B — PDFs oficiais do projeto AprilTag (verificado)

- Introdução e PDF 0–20 da família `tag36h11`:
  `https://ftc-docs.firstinspires.org/en/latest/apriltag/vision_portal/apriltag_intro/apriltag-intro.html`
- Coleção completa (um PDF por tag, 100 mm, carta americana):
  `github.com/rgov/apriltag-pdfs/tree/main/tag36h11/us_letter/100mm`
- Site do projeto: AprilTag, APRIL Robotics Lab, Universidade de Michigan.

## O sticker na tela (simulação)

Os arquivos `public/ui/sticker-*.uikitml` mostram uma representação
**simplificada** no estilo AprilTag (borda preta + grade 6×6). A grade é
ilustrativa: os bits são pseudo-aleatórios derivados do id e **não são
codewords válidos** da família — o sticker na tela não é escaneável de
verdade. Ele existe para a simulação: o pinch no botão "Ler tag"
representa "a câmera leu o AprilTag". Gerador:
`tools/generate-apriltag-stickers.py`.

## Leitura real (fora do v1)

A leitura real entraria pela Passthrough Camera API (câmeras RGB do Quest
3/3S, com permissão do usuário no setup) ou pelo provisionamento assistido
pelo celular (escaneia no telefone, payload via rede local). A pergunta
sobre a permissão para a categoria do app continua em aberto — por isso a
v1 simula. O fluxo depois da leitura não muda: marcador → âncora
persistente → painel.
