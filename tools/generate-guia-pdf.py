#!/usr/bin/env python3
"""
Gera o guia inicial em PDF: a.u.r.a.-by-lola-guia-inicial.pdf

Conteúdo em português, simples e direto. Fonte DejaVu (cobre acentos).
Uso: /tmp/pdf-venv/bin/python tools/generate-guia-pdf.py
"""

from pathlib import Path

from fpdf import FPDF

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "a.u.r.a.-by-lola-guia-inicial.pdf"

FONT_DIR = Path("/usr/share/fonts/truetype/dejavu")
TEAL = (42, 157, 143)
DARK = (16, 20, 24)
GRAY = (90, 100, 114)
LIGHT_BG = (240, 243, 245)


class Guia(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("DejaVu", "", 8)
        self.set_text_color(*GRAY)
        self.cell(0, 8, "a.u.r.a. by Lola — Guia inicial", align="R")
        self.ln(12)

    def footer(self):
        self.set_y(-15)
        self.set_font("DejaVu", "", 8)
        self.set_text_color(*GRAY)
        self.cell(0, 10, f"Página {self.page_no()}/{{nb}}", align="C")

    def h1(self, text: str):
        self.ln(4)
        self.set_font("DejaVu", "B", 15)
        self.set_text_color(*TEAL)
        self.multi_cell(0, 8, text, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def h2(self, text: str):
        self.ln(3)
        self.set_font("DejaVu", "B", 12)
        self.set_text_color(*DARK)
        self.multi_cell(0, 7, text, new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def p(self, text: str):
        self.set_font("DejaVu", "", 10.5)
        self.set_text_color(*DARK)
        self.multi_cell(0, 6, text, align="L", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def bullet(self, text: str):
        self.set_font("DejaVu", "", 10.5)
        self.set_text_color(*DARK)
        x = self.get_x()
        self.cell(6, 6, "•")
        self.multi_cell(0, 6, text, new_x="LMARGIN", new_y="NEXT")
        self.set_x(x)
        self.ln(1)

    def code(self, lines: list[str]):
        self.set_fill_color(*LIGHT_BG)
        self.set_font("Mono", "", 9.5)
        self.set_text_color(*DARK)
        for line in lines:
            self.cell(0, 6, f"  {line}", new_x="LMARGIN", new_y="NEXT", fill=True)
        self.ln(3)

    def note(self, text: str):
        self.set_fill_color(*LIGHT_BG)
        self.set_font("DejaVu", "", 10)
        self.set_text_color(*DARK)
        self.multi_cell(0, 6, text, fill=True, align="L", new_x="LMARGIN", new_y="NEXT")
        self.ln(3)


def build() -> None:
    pdf = Guia("P", "mm", "A4")
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.set_margins(20, 18, 20)
    pdf.add_font("DejaVu", "", str(FONT_DIR / "DejaVuSans.ttf"))
    pdf.add_font("DejaVu", "B", str(FONT_DIR / "DejaVuSans-Bold.ttf"))
    pdf.add_font("Mono", "", str(FONT_DIR / "DejaVuSansMono.ttf"))
    pdf.add_font("Mono", "B", str(FONT_DIR / "DejaVuSansMono-Bold.ttf"))
    pdf.add_page()

    # Capa / título
    pdf.set_font("DejaVu", "B", 26)
    pdf.set_text_color(*TEAL)
    pdf.multi_cell(0, 12, "a.u.r.a. by Lola", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("DejaVu", "B", 16)
    pdf.set_text_color(*DARK)
    pdf.multi_cell(0, 9, "Guia inicial — implementação paralela v1", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf.set_font("DejaVu", "", 10.5)
    pdf.set_text_color(*GRAY)
    pdf.multi_cell(0, 6, "14 de novembro de 2026  •  Para comparar com o seu repo derkauf/a.u.r.a.", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    pdf.h1("1. O que é este repo")
    pdf.p(
        "Este é o A.U.R.A. v1 implementado pela Lola, em paralelo ao seu repo. "
        "Serve para você comparar com o que você está construindo no "
        "derkauf/a.u.r.a., abrir no VS Code + Claude Code e explorar. "
        "O seu repo continua sendo a fonte de verdade — nada aqui toca nele."
    )
    pdf.p(
        "O app é WebXR / IWSDK (TypeScript + Vite). O loop da v1: AprilTag na "
        "parede → âncora espacial persistente → painel do dispositivo → "
        "cursor de raio da mão com snap magnético. Um cômodo, três "
        "dispositivos simulados, sem chamada de IA."
    )
    pdf.h2("Os 3 dispositivos")
    pdf.bullet("Lâmpada da sala (lamp-sala-01) — AprilTag tag36h11 id 0 — liga/desliga + brilho 0–100% (passo 5).")
    pdf.bullet("Ar-condicionado da sala (ac-sala-01) — id 1 — liga/desliga + temperatura 16–30 °C (passo 1).")
    pdf.bullet("Fechadura da porta (lock-porta-01) — id 2 — tranca/destranca + câmera simulada.")

    pdf.h1("2. Antes de rodar — o que instalar")
    pdf.bullet("Node.js 20.19+ / 22.12+ / 24+ e npm — testado aqui com Node v24.22.1 e npm 10.9.4. Baixe em nodejs.org.")
    pdf.bullet("VS Code + Claude Code — o ambiente que você já usa.")
    pdf.bullet("Chrome ou Chromium — o emulador XR roda dentro dele. Na primeira vez, o comando npm run dev baixa o Chromium sozinho (só na primeira vez).")
    pdf.bullet("Meta Quest 3S com modo desenvolvedor — para o teste no headset (segundo passo, depois do emulador).")
    pdf.bullet("RealityScan Desktop (grátis, Epic Games) — só se você quiser os AprilTags imprimíveis para colar na parede. Baixe em realityscan.com/download (instala pelo Epic Games Launcher). O passo a passo está na seção 5.")
    pdf.note(
        "Você NÃO precisa instalar o Meta XR Simulator (o app de desktop) para este teste. "
        "O teste da âncora roda no emulador que o npm run dev abre no navegador (IWER), já "
        "configurado para o perfil Quest 3. O XR Simulator standalone é outra ferramenta, "
        "para apps nativos (Unity/Unreal) — não para este app WebXR."
    )

    pdf.h1("3. Rodando — os comandos exatos")
    pdf.code(["npm install     # uma vez, para instalar as dependências", "npm run dev     # é assim que você abre de manhã"])
    pdf.p("O servidor sobe em:")
    pdf.code(["https://localhost:8081/"])
    pdf.p(
        "O endereço de rede, para abrir no Quest pela mesma Wi-Fi, aparece no "
        "terminal quando o servidor sobe. Aceite o aviso de certificado local — "
        "é esperado, o servidor usa um certificado de desenvolvimento."
    )
    pdf.p("Outros comandos:")
    pdf.code([
        "npm run typecheck   # checagem de tipos — rode antes de testar",
        "npm run build       # build de produção → dist/",
        "npm run test:unit   # 12 testes unitários dos módulos puros",
    ])

    pdf.h1("4. O que você deve ver + o primeiro teste")
    pdf.bullet("O navegador abre com uma sala e 3 stickers brancos no alto (um por dispositivo). Os painéis começam escondidos.")
    pdf.bullet("Entre na sessão XR no emulador (perfil Quest 3, já configurado). Use o mouse/teclado do emulador para simular as mãos, ou pareie o Quest 3S.")
    pdf.bullet('Aponte para um sticker e faça pinch no botão "Ler tag": o painel do dispositivo aparece abaixo do sticker.')
    pdf.bullet("O cursor é um anel branco na ponta do dedo; sobre um controle ele gruda no centro do alvo, cresce e fica âmbar (snap magnético).")
    pdf.h2("Primeiro teste — round-trip da âncora (obrigatório)")
    pdf.p("O procedimento completo está em tests/anchor-roundtrip.md. Resumo:")
    pdf.bullet('Sessão 1: leia os 3 tags ("Ler tag" em cada sticker). Os 3 painéis aparecem; a linha da âncora diz "Âncora: ativa".')
    pdf.bullet("Sessão 2: entre de novo, no mesmo lugar, sem tocar nos stickers. Os 3 painéis já estão lá, no mesmo XYZ; a linha diz \"Âncora: ativa (restaurada)\".")
    pdf.bullet("Teste os controles e saia/entre de novo: os valores persistem (ligado/desligado, temperatura, brilho, tranca).")
    pdf.p("Se falhar, pare e registre o erro exato — o doc do teste diz como.")

    pdf.h1("5. AprilTags — os 3 marcadores")
    pdf.p(
        "Um AprilTag é um marcador preto-e-branco que uma câmera identifica por "
        "um número (id). Foi criado pelo APRIL Robotics Lab da Universidade de "
        "Michigan. Diferente do QR code, o tag carrega só o id — o que ele "
        "significa vive no app."
    )
    pdf.p("Família: tag36h11 (o padrão). Ids: 0 = lâmpada, 1 = ar-condicionado, 2 = fechadura.")
    pdf.h2("Os 3 payloads simulados (o que cada tag resolve no app)")
    pdf.code([
        'lamp-sala-01 | tag36h11 id 0 | light',
        '  controls: power (toggle), brightness 0-100 passo 5',
        '  bind: sim://lamp-sala-01',
        'ac-sala-01 | tag36h11 id 1 | hvac',
        '  controls: power (toggle), setpoint_c 16-30 passo 1',
        '  bind: sim://ac-sala-01',
        'lock-porta-01 | tag36h11 id 2 | lock',
        '  controls: locked (toggle), cam (ação: abre a câmera simulada)',
        '  bind: sim://lock-porta-01',
    ])
    pdf.h2("Como gerar os tags imprimíveis no RealityScan Desktop")
    pdf.bullet("Baixe em realityscan.com/download (Epic Games Launcher, aba RealityScan). Gratuito para estudantes, educadores e receita anual abaixo de US$ 1 milhão.")
    pdf.bullet("Abra um projeto → aba Alignment → ferramenta Detect Markers → gere os marcadores e exporte os PDFs prontos para imprimir.")
    pdf.bullet("Imprima os tags tag36h11 de id 0, 1 e 2, um por dispositivo, e cole cada um no lugar do dispositivo.")
    pdf.bullet("Imprima em tamanho real, sem redimensionar, numa superfície plana e rígida.")
    pdf.note(
        "Se o menu da sua versão do RealityScan não mostrar AprilTag, use os PDFs "
        "oficiais do projeto AprilTag (família tag36h11, ids 0–20): "
        "ftc-docs.firstinspires.org/en/latest/apriltag/vision_portal/apriltag_intro/"
        "apriltag-intro.html — são os mesmos tags."
    )
    pdf.p(
        "Os stickers que aparecem na tela do app são só uma representação "
        "simplificada (a grade é ilustrativa, não é um tag de verdade). A "
        "leitura é simulada: o pinch no botão \"Ler tag\" representa "
        "\"a câmera leu o tag\". A leitura real (pela câmera do Quest) ainda "
        "depende da permissão da Passthrough Camera API, que continua em "
        "aberto — por isso a v1 simula."
    )

    pdf.h1("6. AR Code (ar-code.com) — avaliado, não usado na v1")
    pdf.p(
        "O AR Code gera QR codes que abrem experiências WebAR hospedadas na "
        "plataforma dele. O QR aponta para a URL da AR Code, não carrega o "
        "nosso payload, e o serviço não oferece detecção de tag dentro de um "
        "app WebXR. Não dá um caminho concreto para a v1 — fica como opção a "
        "explorar depois (por exemplo, adesivos que, escaneados com o celular, "
        "mostram uma prévia 3D do dispositivo)."
    )

    pdf.h1("7. O que eu não consegui baixar ou verificar")
    pdf.p("Nada escondido — a lista é esta:")
    pdf.bullet("O navegador gerenciado (Chromium) do npm run dev: estava baixando quando parei o servidor para deixar a porta livre. Na sua máquina ele baixa na primeira vez e abre sozinho.")
    pdf.bullet("Sessão XR no emulador, clique/pinch nos controles e o teste de round-trip: só rodam com o navegador gerenciado ou o headset — não consegui rodar aqui. Verificado aqui: typecheck limpo, 12/12 testes unitários, build OK, dev server sobe e serve o app.")
    pdf.bullet("O menu do gerador de AprilTag no RealityScan: os passos acima vieram do seu print — não consegui confirmar sozinho se a sua versão mostra \"AprilTag\" no menu. Se não mostrar, use os PDFs oficiais (seção 5).")
    pdf.bullet("Glifos °C, ã, ç na fonte dos painéis; o painel escondido sumir mesmo com o raycast; o clique no sticker fora do botão \"Ler tag\" — a confirmar no emulador.")
    pdf.bullet("O deploy público (GitHub Pages, sua decisão) ainda não foi feito — o app roda local com npm run dev.")

    pdf.output(str(OUT))
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    build()
