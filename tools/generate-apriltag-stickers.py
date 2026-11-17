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


# Visual de ícone de app do Horizon OS: um "squircle" branco com o tag dentro,
# o nome do dispositivo embaixo, sem card de fundo (flutua sobre o passthrough).
# Unidades: o nó de cena usa escala 0.1, então 1 unidade = 1 mm.
STYLES = """<style>
  .icon-root {
    flex-direction: column;
    align-items: center;
    width: 140px;
    gap: 8px;
    cursor: pointer;
  }

  .icon-tile {
    width: 96px;
    height: 96px;
    background-color: #ffffff;
    border-radius: 24px;
    border-width: 3px;
    border-color: #62e2ef;
    justify-content: center;
    align-items: center;
  }

  .tag-grid {
    flex-direction: column;
  }

  .tag-row {
    flex-direction: row;
  }

  .cell-on {
    width: 8px;
    height: 8px;
    background-color: #111111;
  }

  .cell-off {
    width: 8px;
    height: 8px;
    background-color: #ffffff;
  }

  .icon-label {
    color: #e9f2f9;
    font-size: 15px;
    font-weight: 700;
    text-align: center;
  }
</style>
"""


def render_sticker(slug: str, device_id: str, tag_id: int, label: str, label_en: str) -> str:
    rows = grid_rows(tag_id)
    grid = ["    <div class=\"tag-grid\">"]
    for row in rows:
        cells = "".join(
            f"<div class=\"{'cell-on' if cell else 'cell-off'}\"></div>" for cell in row
        )
        grid.append(f"      <div class=\"tag-row\">{cells}</div>")
    grid.append("    </div>")
    grid_markup = "\n".join(grid)
    return f"""<!--
  Ícone do tag — {label} ({device_id}), AprilTag tag36h11 id {tag_id}.
  Visual de ícone de app do Horizon OS: o tag num quadrado branco, o nome
  do dispositivo embaixo. A grade 6x6 é ilustrativa e NÃO é um codeword
  válido. O ícone inteiro é o botão (id sticker-scan-button): o primeiro
  pinch simula a leitura ("a câmera leu o tag") e abre o painel; os
  seguintes abrem e fecham. O raio por cima aumenta o ícone (hover, em
  src/ui/hover-scale-system.ts). Gerado por tools/generate-apriltag-stickers.py.
  Os tags imprimíveis de verdade estão em docs/apriltag-markers.md.
-->
{STYLES}<div id="sticker-scan-button" class="icon-root">
  <div class="icon-tile">
{grid_markup}
  </div>
  <div id="sticker-scan-label" class="icon-label">{label_en}</div>
</div>
"""


def main() -> None:
    for slug, device_id, tag_id, label, label_en in DEVICES:
        path = UI_DIR / f"sticker-{slug}.uikitml"
        path.write_text(render_sticker(slug, device_id, tag_id, label, label_en), encoding="utf-8", newline="\n")
        print(f"wrote {path}")


if __name__ == "__main__":
    main()
