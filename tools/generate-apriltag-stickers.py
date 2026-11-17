#!/usr/bin/env python3
"""
Gera os 3 stickers AprilTag (public/ui/sticker-*.uikitml).

O desenho é o tag36h11 de verdade: borda preta + os 6x6 bits do código
IMPRESSO (PRINTED_TAG_CODES, os mesmos de src/markers/apriltag-detector.ts,
lidos do PDF em docs/apriltag/). Bit 1 = branco. Na Phase 3 o ícone vai
para cima do tag físico quando a câmera o lê, então ele precisa ser igual
ao papel.

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
    ("tv", "tv-sala-01", 10, "TV da sala", "Living room TV"),
]

# Códigos tag36h11 dos tags impressos 1..12 (índice 0 = impresso 001).
PRINTED_TAG_CODES = [
    0x110bba61, 0x111dd66e, 0x14d2df6a, 0x196b856c, 0x3b4712d5, 0x4b029eec,
    0x4d25374b, 0x56a5d085, 0x5df03f91, 0x67299b45, 0x6e5aaa6b, 0x6f8a5d94,
]


# Grade: fundo preto e só as células brancas desenhadas (cell-off). Desenhar
# as pretas célula por célula deixava emendas claras entre elas, que
# quebravam o contorno do tag. (UIKitML não aceita comentários no <style>.)


def data_bits(tag_id: int) -> list[list[int]]:
    """Os 6x6 bits do tag impresso, linha a linha; 1 = célula PRETA aqui."""
    code = format(PRINTED_TAG_CODES[tag_id - 1], "036b")
    # No código tag36h11, bit 1 = branco; na grade, 1 = preto (cell-on).
    return [[0 if code[r * 6 + c] == "1" else 1 for c in range(6)] for r in range(6)]


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
    background-color: #111111;
  }

  .tag-row {
    flex-direction: row;
  }

  .cell-on {
    width: 8px;
    height: 8px;
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
  do dispositivo embaixo. A grade é o código real do tag impresso: quando a
  câmera lê o tag (Phase 3), este ícone vai para cima do tag físico. O
  ícone inteiro é o botão (id sticker-scan-button): abre e fecha a janela
  do dispositivo (antes da leitura, o primeiro pinch simula a leitura). O raio por cima aumenta o ícone (hover, em
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
