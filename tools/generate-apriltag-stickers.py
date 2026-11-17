#!/usr/bin/env python3
"""
Gera os 3 stickers AprilTag (public/ui/sticker-*.uikitml).

O desenho é uma representação SIMPLIFICADA no estilo AprilTag tag36h11:
borda preta + grade 6x6 de bits. Os bits são pseudo-aleatórios derivados
do id do tag — NÃO são codewords válidos da família tag36h11, e o sticker
na tela NÃO é escaneável de verdade. Ele existe para a simulação: o
pinch no botão "Ler tag" representa "a câmera leu o AprilTag".

Os tags imprimíveis de verdade (para colar na parede) são gerados no
RealityScan Desktop ou baixados dos PDFs oficiais do projeto AprilTag —
ver docs/apriltag-markers.md. Os ids usados aqui são os mesmos de lá
(tag36h11: 1 = lâmpada, 2 = ar-condicionado, 3 = fechadura; o id 0 não é
usado porque o gerador do RealityScan Desktop começa no 1).

Uso: python3 tools/generate-apriltag-stickers.py
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UI_DIR = ROOT / "public" / "ui"

# (slug, device_id, tag_id, nome em pt-BR para o comentário, texto padrão em inglês).
# O texto exibido é trocado em tempo de execução pelo AuraLocalizationSystem.
DEVICES = [
    ("lamp", "lamp-sala-01", 1, "Lâmpada da sala", "Living room lamp"),
    ("ac", "ac-sala-01", 2, "Ar-condicionado da sala", "Living room AC"),
    ("lock", "lock-porta-01", 3, "Fechadura da porta", "Front door lock"),
]


def data_bits(tag_id: int) -> list[list[int]]:
    """36 bits pseudo-aleatórios determinísticos a partir do id (xorshift32)."""
    state = ((tag_id + 1) * 2654435761) & 0xFFFFFFFF
    bits: list[list[int]] = []
    for _row in range(6):
        row: list[int] = []
        for _col in range(6):
            state ^= (state << 13) & 0xFFFFFFFF
            state ^= state >> 17
            state ^= (state << 5) & 0xFFFFFFFF
            state &= 0xFFFFFFFF
            row.append((state >> 31) & 1)
        bits.append(row)
    return bits


def grid_rows(tag_id: int) -> list[list[int]]:
    """Grade 8x8: anel preto + 6x6 de dados + anel preto (o branco é o painel)."""
    data = data_bits(tag_id)
    rows: list[list[int]] = []
    rows.append([1] * 8)
    for r in range(6):
        rows.append([1] + data[r] + [1])
    rows.append([1] * 8)
    return rows


STYLES = """<style>
  .sticker-root {
    flex-direction: column;
    width: 260px;
    padding-top: 20px;
    padding-bottom: 20px;
    padding-left: 20px;
    padding-right: 20px;
    gap: 12px;
    background-color: #ffffff;
    border-radius: 16px;
    align-items: center;
  }

  .tag-grid {
    flex-direction: column;
  }

  .tag-row {
    flex-direction: row;
  }

  .cell-on {
    width: 16px;
    height: 16px;
    background-color: #111111;
  }

  .cell-off {
    width: 16px;
    height: 16px;
    background-color: #ffffff;
  }

  .sticker-sub {
    color: #5a6472;
    font-size: 16px;
    text-align: center;
  }

  .scan-button {
    min-height: 56px;
    padding-top: 10px;
    padding-bottom: 10px;
    padding-left: 12px;
    padding-right: 12px;
    background-color: #2a9d8f;
    border-radius: 12px;
    justify-content: center;
    align-items: center;
    align-self: stretch;
  }

  .scan-label {
    color: #ffffff;
    font-size: 20px;
    font-weight: 700;
    text-align: center;
  }
</style>
"""


def render_sticker(slug: str, device_id: str, tag_id: int, label: str, label_en: str) -> str:
    rows = grid_rows(tag_id)
    grid = ["  <div class=\"tag-grid\">"]
    for row in rows:
        cells = "".join(
            f"<div class=\"{'cell-on' if cell else 'cell-off'}\"></div>" for cell in row
        )
        grid.append(f"    <div class=\"tag-row\">{cells}</div>")
    grid.append("  </div>")
    grid_markup = "\n".join(grid)
    return f"""<!--
  Sticker AprilTag — {label} ({device_id}).
  Representação SIMPLIFICADA no estilo tag36h11 (id {tag_id}): a grade
  6x6 é ilustrativa e NÃO é um codeword válido — este sticker na tela
  não é escaneável de verdade. O botão mostra o nome do dispositivo: o
  primeiro pinch simula a leitura ("a câmera leu o tag") e abre o painel;
  os seguintes abrem e fecham o painel. Gerado por
  tools/generate-apriltag-stickers.py. Os tags imprimíveis de verdade
  estão em docs/apriltag-markers.md.
-->
{STYLES}<Panel class="sticker-root">
{grid_markup}
  <div id="txt-sticker-sub" class="sticker-sub">AprilTag tag36h11 • id {tag_id}</div>
  <Button id="sticker-scan-button" class="scan-button">
    <ButtonLabel id="sticker-scan-label" class="scan-label">{label_en}</ButtonLabel>
  </Button>
</Panel>
"""


def main() -> None:
    for slug, device_id, tag_id, label, label_en in DEVICES:
        path = UI_DIR / f"sticker-{slug}.uikitml"
        path.write_text(render_sticker(slug, device_id, tag_id, label, label_en), encoding="utf-8", newline="\n")
        print(f"wrote {path}")


if __name__ == "__main__":
    main()
