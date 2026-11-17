#!/usr/bin/env python3
"""
Gera os dois PDFs da submissão do Meta VR Start (prazo: 18/nov/2026, 12:00 PT):

  docs/submission/aura-roteiro-video.pdf   roteiro do vídeo demo (< 3 min)
  docs/submission/aura-devpost-rascunho.pdf  rascunho do texto do Devpost

Instruções em português; narração e texto do Devpost em inglês (juízes).
Mesmo visual de tools/generate-guia-pdf.py (fonte DejaVu, cobre acentos).

Uso:  python tools/generate-submission-pdfs.py   (precisa de fpdf2)
No Windows (sem DejaVu no sistema): DEJAVU_DIR=<pasta com os .ttf> python tools/generate-submission-pdfs.py
"""

import os
from pathlib import Path

from fpdf import FPDF

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "docs" / "submission"
FONT_DIR = Path(os.environ.get("DEJAVU_DIR", "/usr/share/fonts/truetype/dejavu"))

# Placeholders que ainda dependem de decisões (atualizar e gerar de novo).
APP_URL = "https://aura.sixvectors.app/"
VIDEO_URL = "(link do YouTube/Vimeo, depois da gravação)"

TEAL = (42, 157, 143)
DARK = (16, 20, 24)
GRAY = (90, 100, 114)
LIGHT_BG = (240, 243, 245)
WARN_BG = (253, 243, 224)


class Doc(FPDF):
    def __init__(self, running_title: str):
        super().__init__("P", "mm", "A4")
        self.running_title = running_title
        self.alias_nb_pages()
        self.set_auto_page_break(auto=True, margin=20)
        self.set_margins(20, 18, 20)
        self.add_font("DejaVu", "", str(FONT_DIR / "DejaVuSans.ttf"))
        self.add_font("DejaVu", "B", str(FONT_DIR / "DejaVuSans-Bold.ttf"))
        self.add_font("Mono", "", str(FONT_DIR / "DejaVuSansMono.ttf"))
        self.add_font("Mono", "B", str(FONT_DIR / "DejaVuSansMono-Bold.ttf"))

    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("DejaVu", "", 8)
        self.set_text_color(*GRAY)
        self.cell(0, 8, self.running_title, align="R")
        self.ln(12)

    def footer(self):
        self.set_y(-15)
        self.set_font("DejaVu", "", 8)
        self.set_text_color(*GRAY)
        self.cell(0, 10, f"Página {self.page_no()}/{{nb}}", align="C")

    def cover(self, title: str, subtitle: str, meta: str):
        self.add_page()
        self.set_font("DejaVu", "B", 26)
        self.set_text_color(*TEAL)
        self.multi_cell(0, 12, title, new_x="LMARGIN", new_y="NEXT")
        self.set_font("DejaVu", "B", 15)
        self.set_text_color(*DARK)
        self.multi_cell(0, 8, subtitle, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)
        self.set_font("DejaVu", "", 10)
        self.set_text_color(*GRAY)
        self.multi_cell(0, 6, meta, new_x="LMARGIN", new_y="NEXT")
        self.ln(4)

    def h1(self, text: str):
        if self.get_y() > 245:  # não deixar o título sozinho no pé da página
            self.add_page()
        self.ln(3)
        self.set_font("DejaVu", "B", 14)
        self.set_text_color(*TEAL)
        self.multi_cell(0, 8, text, new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def h2(self, text: str):
        self.ln(2)
        self.set_font("DejaVu", "B", 11.5)
        self.set_text_color(*DARK)
        self.multi_cell(0, 7, text, new_x="LMARGIN", new_y="NEXT")

    def p(self, text: str, size: float = 10.5):
        self.set_font("DejaVu", "", size)
        self.set_text_color(*DARK)
        self.multi_cell(0, 6, text, align="L", new_x="LMARGIN", new_y="NEXT")
        self.ln(1.5)

    def bullet(self, text: str):
        self.set_font("DejaVu", "", 10.5)
        self.set_text_color(*DARK)
        self.cell(6, 6, "•")
        self.multi_cell(0, 6, text, new_x="LMARGIN", new_y="NEXT")
        self.ln(0.5)

    def check(self, text: str):
        self.set_font("DejaVu", "", 10.5)
        self.set_text_color(*DARK)
        self.cell(7, 6, "☐")
        self.multi_cell(0, 6, text, new_x="LMARGIN", new_y="NEXT")
        self.ln(0.5)

    def box(self, text: str, fill=LIGHT_BG):
        self.set_fill_color(*fill)
        self.set_font("DejaVu", "", 10)
        self.set_text_color(*DARK)
        self.multi_cell(0, 6, text, fill=True, align="L", new_x="LMARGIN", new_y="NEXT")
        self.ln(2.5)

    def scene(self, time: str, title: str, shot: str, action: str, vo: str):
        """Uma cena do roteiro: tempo, título, enquadramento, ação e narração."""
        if self.get_y() > 235:
            self.add_page()
        self.ln(2)
        self.set_fill_color(*TEAL)
        self.set_text_color(255, 255, 255)
        self.set_font("DejaVu", "B", 10.5)
        self.cell(0, 7, f"  {time}   {title}", fill=True, new_x="LMARGIN", new_y="NEXT")
        self.ln(1)
        for label, text in (("Imagem", shot), ("Ação", action)):
            self.set_font("DejaVu", "B", 9.5)
            self.set_text_color(*GRAY)
            self.cell(18, 6, label)
            self.set_font("DejaVu", "", 10)
            self.set_text_color(*DARK)
            self.multi_cell(0, 6, text, new_x="LMARGIN", new_y="NEXT")
        self.set_font("DejaVu", "B", 9.5)
        self.set_text_color(*GRAY)
        self.cell(18, 6, "Narração")
        self.set_fill_color(*LIGHT_BG)
        self.set_font("DejaVu", "", 10)
        self.set_text_color(*DARK)
        self.multi_cell(0, 6, f"“{vo}”", fill=True, new_x="LMARGIN", new_y="NEXT")
        self.ln(1)


def build_video_script() -> Path:
    pdf = Doc("A.U.R.A. — Roteiro do vídeo demo")
    pdf.cover(
        "A.U.R.A.",
        "Roteiro do vídeo demo (menos de 3 min)",
        "Rascunho de 17/nov/2026  •  Meta VR Start Developer Competition  •  "
        "Prazo da submissão: quarta, 18/nov/2026, 12:00 PT",
    )

    pdf.h1("1. O que o vídeo precisa cumprir")
    pdf.bullet("Duração abaixo de 3:00. Mire em 2:40–2:50 para ter margem.")
    pdf.bullet("Público no YouTube ou Vimeo (regra da competição).")
    pdf.bullet("Footage real do Quest (ou do XR Simulator). Não mostrar o editor nem o emulador do PC.")
    pdf.bullet(
        "Provar a persistência cedo: as anotações do workshop \"How to Win\" pedem "
        "mostrar \"the room remembers\" no primeiro minuto, não só no fim."
    )
    pdf.bullet("Só as mãos (hands-first) e sentado (o \"airplane seat test\", painéis a ~60 cm).")
    pdf.box(
        "Honestidade: na v1, a leitura do AprilTag é simulada (o pinch em \"Scan tag\" "
        "representa a câmera lendo o tag). A narração diz isso. Não afirmar detecção "
        "real por câmera nem afiliação com a Meta.",
        fill=WARN_BG,
    )

    pdf.h1("2. Estrutura em tomadas")
    pdf.p(
        "O primeiro uso e o retorno exigem estados diferentes do app, então grave em "
        "tomadas separadas e monte na edição:"
    )
    pdf.bullet(
        "Tomada A — primeiro uso: dados do site limpos. Ler os 3 tags, controlar os "
        "dispositivos, trocar o idioma, voltar para English."
    )
    pdf.bullet(
        "Tomada B — retorno: sair do app e abrir de novo, sem tocar nos stickers. Os "
        "painéis voltam no mesmo lugar com \"Anchor: active (restored)\"."
    )
    pdf.p("Na edição, um trecho curto da Tomada B abre o vídeo (cena 1), e a Tomada B completa entra na cena 5.")

    pdf.h1("3. Roteiro cena a cena")
    pdf.scene(
        "0:00–0:20", "Abertura: a sala lembra",
        "Passthrough da sala; os 3 painéis já flutuando nos lugares (trecho da Tomada B).",
        "Olhar de um painel para o outro, devagar. Close na linha \"Anchor: active (restored)\".",
        "This is A.U.R.A., Ambient User Responsive Automation. I just put my headset on, "
        "and my home controls are exactly where I left them. The room remembers.",
    )
    pdf.scene(
        "0:20–0:40", "O problema",
        "Visão geral da sala em passthrough; os stickers na parede.",
        "Nenhuma ação; deixar a câmera parada, ou um movimento lento.",
        "Smart home controls usually live in phone menus, far from the things they control. "
        "A.U.R.A. puts each control right where the device is, and keeps it there.",
    )
    pdf.scene(
        "0:40–1:15", "Ler o tag (Tomada A)",
        "Sticker da lâmpada em primeiro plano; a mão entra no quadro.",
        "Apontar com a mão e fazer pinch em \"Scan tag\" na lâmpada; o painel aparece. "
        "Repetir rápido no ar-condicionado e na fechadura.",
        "Each device has an AprilTag. In this build, a pinch stands in for the camera "
        "reading the tag. The tag resolves to the device, and A.U.R.A. anchors its panel "
        "right there, with a persistent spatial anchor.",
    )
    pdf.scene(
        "1:15–1:50", "Controlar só com as mãos (Tomada A)",
        "Painéis em close, um de cada vez.",
        "Lâmpada: Turn on, depois + no brilho. Ar: Turn on, + na temperatura. "
        "Fechadura: Unlock, depois View camera e Close camera.",
        "Hands only. Point, pinch, done. Lights, temperature and the door lock, "
        "all simulated in v1, all driven by one device registry.",
    )
    pdf.scene(
        "1:50–2:25", "Sair e voltar: a prova (Tomada B)",
        "Começa dentro da sessão; corte para o retorno.",
        "Sair do app. Abrir de novo e tocar em Enter XR, sem tocar nos stickers. "
        "Mostrar os 3 painéis no mesmo lugar e os valores mantidos (brilho, temperatura, tranca).",
        "Now I leave and come back. No re-scanning, no setup. Same place, same state. "
        "The anchors are restored by the browser, and the values persist with them.",
    )
    pdf.scene(
        "2:25–2:40", "Dois idiomas",
        "Painel Settings em close.",
        "Pinch em Português (BR): tudo troca. Pinch em English: volta.",
        "The whole interface switches between English and Brazilian Portuguese, "
        "and remembers your choice.",
    )
    pdf.scene(
        "2:40–2:55", "O que vem depois e encerramento",
        "Sala inteira com os painéis; card final com o nome e o link.",
        "Nenhuma ação; card final por 3–4 s.",
        "Next: real tag detection with the camera, real devices over Matter, "
        "and an on-device assistant. A.U.R.A. Your home, remembered.",
    )

    pdf.h1("4. Checklist antes de gravar")
    pdf.h2("Headset e ambiente")
    pdf.check("Bateria acima de 70%; lentes limpas; sala bem iluminada (o passthrough fica melhor).")
    pdf.check("Controles largados longe do corpo, para o Quest usar o hand tracking.")
    pdf.check("Sentado, na posição em que vai gravar; a cena aparece a ~60 cm.")
    pdf.check("Gravação de teste de 10 s: confirme que o vídeo capta o passthrough e o áudio da narração (ou grave a narração depois).")
    pdf.h2("App")
    pdf.check(f"Abrir pelo link público: {APP_URL}.")
    pdf.check("Idioma em English antes da Tomada A.")
    pdf.check(
        "Tomada A: limpar os dados do site no Quest Browser (configurações do navegador → "
        "privacidade/dados de sites → o domínio do app). Isso também apaga a âncora salva."
    )
    pdf.check("Tomada B: não limpar nada; só sair e abrir de novo.")
    pdf.check("Fazer um ensaio completo sem gravar.")
    pdf.h2("Gravar")
    pdf.check("No Quest: botão Meta → câmera → gravar vídeo. Ou transmitir para o celular pelo app Meta Horizon e gravar a tela.")
    pdf.check("Movimentos de cabeça lentos; segurar 2–3 s em cada resultado (painel aparecendo, valor mudando).")
    pdf.check("Gravar cada tomada pelo menos duas vezes.")
    pdf.h2("Publicar")
    pdf.check("Editar abaixo de 3:00; card final com nome e link.")
    pdf.check("Subir no YouTube ou Vimeo como público; colar o link no Devpost.")

    out = OUT_DIR / "aura-roteiro-video.pdf"
    pdf.output(str(out))
    return out


def build_devpost_draft() -> Path:
    pdf = Doc("A.U.R.A. — Devpost draft")
    pdf.cover(
        "A.U.R.A.",
        "Rascunho do texto do Devpost",
        "Rascunho de 17/nov/2026  •  Trilha Productivity, divisão New Experience  •  "
        "Texto em inglês, pronto para colar; revisar antes de submeter",
    )
    pdf.box(
        "Antes de submeter: (1) confirmar o link do app e o do vídeo; (2) conferir se cada "
        "afirmação continua verdadeira no build final; (3) não usar logos ou marcas da "
        "Meta de forma que sugira um app oficial.",
        fill=WARN_BG,
    )

    pdf.h1("Name and tagline")
    pdf.p("A.U.R.A. — Ambient User Responsive Automation")
    pdf.p("Your home, remembered. Spatial smart-home controls that stay where your devices are.")

    pdf.h1("Inspiration")
    pdf.p(
        "Smart home apps put every light, thermostat and lock behind phone menus, far from "
        "the things they control. On a Quest with passthrough, the room itself can be the "
        "interface. We wanted controls that live next to each device and are still there "
        "every time you come back: a room that remembers."
    )

    pdf.h1("What it does")
    pdf.bullet("Each device in the room has an AprilTag (tag36h11). Scanning a tag binds the device and anchors its control panel at that spot with a persistent spatial anchor.")
    pdf.bullet("Hands only: point with your hand and pinch to turn the lamp on and set its brightness, set the AC temperature, or lock and unlock the door, with a simulated door camera.")
    pdf.bullet("Leave and come back: the panels reappear in the same place, marked \"Anchor: active (restored)\", and every value persists.")
    pdf.bullet("The interface switches between English and Brazilian Portuguese from a Settings panel and remembers the choice.")
    pdf.p(
        "Scope of v1: one room and three simulated devices. Tag reading is simulated in this "
        "build (a pinch stands in for the camera reading the tag); the anchor, panels and "
        "persistence are real.",
        size=10,
    )

    pdf.h1("How we built it")
    pdf.bullet("Immersive Web SDK (IWSDK) 1.1.0 on WebXR, running in the Quest Browser: judges open a link, nothing to install.")
    pdf.bullet("An entity-component-system architecture: a device registry is the single source of truth, and systems bind it to UIKitML panels.")
    pdf.bullet("Persistent anchors through the WebXR anchors feature: the anchor handle is stored and restored on the next session, and every panel is attached to it.")
    pdf.bullet("UIKitML panels in the Horizon UI kit, a hand-ray cursor, and a localization layer (English and pt-BR).")
    pdf.bullet("Built with an AI-assisted workflow (Claude Code) and tested first in the IWSDK emulator (Quest 3 profile), then on a Meta Quest 3S.")

    pdf.h1("Challenges we ran into")
    pdf.bullet("Persistent anchors in the browser are still experimental, so we validated the leave-and-return round trip on the headset before building anything else.")
    pdf.bullet("The bundled panel fonts only covered ASCII, so accented text broke. We generate a full-Latin MSDF font at runtime from a TTF.")
    pdf.bullet("Testing on a headset over Wi-Fi needed a development certificate that covers the LAN address, so the browser offers to proceed.")

    pdf.h1("Accomplishments that we're proud of")
    pdf.bullet("The core promise works on a real Quest: leave the app, come back, and the room is exactly as you left it.")
    pdf.bullet("A hands-first loop that fits in under a minute: scan, control, leave, return.")
    pdf.bullet("A clean device registry and tag schema that can point at real devices later without changing the panels.")

    pdf.h1("What we learned")
    pdf.bullet("Scoping to one room and one mechanic, and finishing it, beats a wider prototype.")
    pdf.bullet("Persistence has to be proven on the device early; the emulator alone is not enough.")

    pdf.h1("What's next for A.U.R.A.")
    pdf.bullet("Real AprilTag detection with the headset camera.")
    pdf.bullet("Real devices over Matter, using the same device descriptors.")
    pdf.bullet("An assistant behind a provider interface that is already in the code base, with Llama as a target.")
    pdf.bullet("More rooms, then glasses-class devices.")

    pdf.h1("Built with")
    pdf.p("iwsdk · webxr · three.js · typescript · vite · uikitml · meta-quest-browser · apriltag")

    pdf.h1("Try it out — testing instructions for judges")
    pdf.bullet(f"Link: {APP_URL}")
    pdf.bullet("On a Meta Quest, open the link in the Quest Browser and tap Enter XR. Allow the permissions it asks for.")
    pdf.bullet("Put the controllers down to use hand tracking. Sit; the scene is about 60 cm in front of you.")
    pdf.bullet("Point and pinch \"Scan tag\" on each sticker. A control panel appears for each device.")
    pdf.bullet("Change some values, exit, and open the link again. The panels return in place, marked \"Anchor: active (restored)\", with the same values.")
    pdf.bullet("Optional: switch the language in the Settings panel.")

    pdf.h1("Video")
    pdf.p(VIDEO_URL)

    out = OUT_DIR / "aura-devpost-rascunho.pdf"
    pdf.output(str(out))
    return out


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for out in (build_video_script(), build_devpost_draft()):
        print(f"wrote {out} ({out.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
