#!/usr/bin/env python3
"""
A.U.R.A. user guide (PDF): step by step, for anyone who opens the site.

16:9 pages, one step per page, so the guide can be the storyboard of the
motion-design tutorial video. Scenes follow the illustrated-guide style
(docs/ux/ux-illustrated-guide: light #F0F2F5, Meta blue #0082FB, white cards
with a blue outline) and reuse its three illustrations; pictures of the app
UI are drawn in the app's real colors (dark glass, cyan rests, amber acts:
docs/ux/VISUAL_ID.md; device colors: docs/ux/DEVICE_CONVENTION.md).

Output: docs/guide/aura-user-guide.pdf, copied to public/guide/ so the site
serves it (linked from the welcome page in index.html).

Run (needs fpdf2 and Pillow): python tools/generate-user-guide.py
"""

from pathlib import Path
import shutil

from fpdf import FPDF
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "public" / "fonts"
ILLUS = ROOT / "docs" / "ux" / "ux-illustrated-guide"
OUT = ROOT / "docs" / "guide" / "aura-user-guide.pdf"
PUBLIC_OUT = ROOT / "public" / "guide" / "aura-user-guide.pdf"
SITE = "aura.sixvectors.app"

W, H = 338.67, 190.5  # 16:9 (1280 x 720 px at 96 dpi)
M = 18  # margin

# Guide palette (illustrated-guide style)
BG = (240, 242, 245)
CARD = (255, 255, 255)
INK = (28, 30, 33)
MUTED = (96, 103, 112)
BLUE = (0, 130, 251)
LINE = (223, 227, 232)
SOFT_BLUE = (230, 242, 255)
WARN = (192, 57, 43)
# App palette (docs/ux/VISUAL_ID.md)
GLASS = (27, 46, 63)
GLASS2 = (47, 64, 82)
GLASS_LINE = (78, 112, 137)
CYAN = (98, 226, 239)
AMBER = (255, 184, 80)
TEXT = (233, 242, 249)
TEXT_MUTED = (143, 179, 196)
RED = (255, 90, 95)
GREEN = (61, 220, 132)
ICE = (74, 168, 255)

# Printed tag codes (src/markers/apriltag-detector.ts), index 0 = tag 1.
TAG_CODES = [
    0x110BBA61, 0x111DD66E, 0x14D2DF6A, 0x196B856C, 0x3B4712D5, 0x4B029EEC,
    0x4D25374B, 0x56A5D085, 0x5DF03F91, 0x67299B45, 0x6E5AAA6B, 0x6F8A5D94,
]


class Guide(FPDF):
    def __init__(self) -> None:
        super().__init__(orientation="L", unit="mm", format=(H, W))
        self.set_auto_page_break(False)
        self.add_font("Inter", "", str(FONTS / "Inter-latin-400.ttf"))
        self.add_font("Inter", "B", str(FONTS / "Inter-latin-700.ttf"))
        self.page_no_shown = 0

    # ---------- basics ----------
    def fill(self, rgb):
        self.set_fill_color(*rgb)

    def stroke(self, rgb, width=0.4):
        self.set_draw_color(*rgb)
        self.set_line_width(width)

    def ink(self, rgb):
        self.set_text_color(*rgb)

    def box(self, x, y, w, h, fill=None, line=None, r=4, lw=0.6):
        style = ("F" if fill else "") + ("D" if line else "")
        if fill:
            self.fill(fill)
        if line:
            self.stroke(line, lw)
        self.rect(x, y, w, h, style=style or "D", round_corners=r > 0, corner_radius=r)

    def dot(self, cx, cy, r, fill=None, line=None, lw=0.6):
        style = ("F" if fill else "") + ("D" if line else "")
        if fill:
            self.fill(fill)
        if line:
            self.stroke(line, lw)
        self.ellipse(cx - r, cy - r, 2 * r, 2 * r, style=style)

    def text_at(self, x, y, s, size=12, bold=False, rgb=INK, w=None, align="L", lh=None):
        self.set_font("Inter", "B" if bold else "", size)
        self.ink(rgb)
        self.set_xy(x, y)
        if w is None:
            self.cell(0, size * 0.42, s)
        else:
            self.multi_cell(w, lh or size * 0.5, s, align=align)
        return self.get_y()

    def bullets(self, x, y, items, w, size=12, gap=3.2, rgb=MUTED):
        for it in items:
            self.dot(x + 1.4, y + 2.6, 1.1, fill=BLUE)
            y = self.text_at(x + 5, y, it, size=size, rgb=rgb, w=w - 5) + gap
        return y

    def image_fit(self, path, x, y, w, h):
        im = Image.open(path).convert("RGB")
        iw, ih = im.size
        target = w / h
        if iw / ih > target:  # crop sides
            nw = int(ih * target)
            im = im.crop(((iw - nw) // 2, 0, (iw - nw) // 2 + nw, ih))
        else:
            nh = int(iw / target)
            im = im.crop((0, (ih - nh) // 2, iw, (ih - nh) // 2 + nh))
        self.image(im, x, y, w, h)

    # ---------- page frame ----------
    def slide(self, step=None, title="", kicker=None):
        self.add_page()
        self.fill(BG)
        self.rect(0, 0, W, H, style="F")
        self.page_no_shown += 1
        if step is not None:
            self.dot(M + 6, M + 6, 6, fill=BLUE)
            self.text_at(M + 1.2 if step < 10 else M + 0.2, M + 3.4, str(step), size=13, bold=True, rgb=CARD, w=10, align="C")
            self.text_at(M + 16, M + 2.6, title, size=22, bold=True)
        elif title:
            self.text_at(M, M + 2.6, title, size=22, bold=True)
        if kicker:
            self.text_at(M + (16 if step is not None else 0), M + 13, kicker, size=11, rgb=MUTED)
        self.text_at(M, H - 10, "A.U.R.A.  ·  Getting started", size=8.5, rgb=MUTED)
        self.text_at(W - M - 40, H - 10, f"{SITE}   {self.page_no_shown}", size=8.5, rgb=MUTED, w=40, align="R")

    def callout(self, x, y, w, title, body, rgb=BLUE):
        self.set_font("Inter", "", 11)
        lines = self.multi_cell(w - 12, 5.4, body, dry_run=True, output="LINES")
        h = 12 + 5.4 * len(lines) + 4
        self.box(x, y, w, h, fill=CARD, line=rgb, r=4, lw=0.8)
        self.fill(rgb)
        self.rect(x, y + 3, 1.6, h - 6, style="F")
        self.text_at(x + 6, y + 4, title, size=11.5, bold=True, rgb=rgb)
        self.text_at(x + 6, y + 10.5, body, size=11, rgb=MUTED, w=w - 12, lh=5.4)
        return y + h

    # ---------- drawn pieces (app look) ----------
    def tag(self, x, y, size, tag_id, label=None, frame=True):
        """The printed tag: white quiet zone, black 8x8 with the real 6x6 bits."""
        if frame:
            self.box(x, y, size, size, fill=CARD, line=LINE, r=0.6, lw=0.3)
        cell = size / 10
        ox, oy = x + cell, y + cell
        self.fill(INK)
        self.rect(ox, oy, cell * 8, cell * 8, style="F")
        bits = format(TAG_CODES[tag_id - 1], "036b")
        self.fill(CARD)
        for r in range(6):
            for c in range(6):
                if bits[r * 6 + c] == "1":
                    self.rect(ox + (c + 1) * cell, oy + (r + 1) * cell, cell + 0.02, cell + 0.02, style="F")
        if label:
            self.text_at(x - 10, y + size + 2, label, size=9, rgb=MUTED, w=size + 20, align="C")

    def tag_icon(self, x, y, s, tag_id, label):
        """The app's tag icon: white tile, cyan outline, label under it."""
        self.box(x, y, s, s, fill=CARD, line=CYAN, r=s * 0.22, lw=0.9)
        self.tag(x + s * 0.12, y + s * 0.12, s * 0.76, tag_id, frame=False)
        self.text_at(x - 12, y + s + 1.5, label, size=8, bold=True, rgb=INK, w=s + 24, align="C")

    def round_button(self, cx, cy, r, kind, active=False):
        self.dot(cx, cy, r, fill=AMBER if active else GLASS2, line=CYAN if kind == "scan" else None, lw=0.5)
        col = GLASS if active else (CYAN if kind == "scan" else TEXT)
        self.stroke(col, 0.55)
        if kind == "gear":
            self.dot(cx, cy, r * 0.42, line=col, lw=0.55)
            for i in range(8):
                import math
                a = i * math.pi / 4
                self.line(cx + math.cos(a) * r * 0.45, cy + math.sin(a) * r * 0.45, cx + math.cos(a) * r * 0.62, cy + math.sin(a) * r * 0.62)
        else:  # scan: corners + line
            k = r * 0.5
            for sx in (-1, 1):
                for sy in (-1, 1):
                    self.line(cx + sx * k, cy + sy * k, cx + sx * k * 0.45, cy + sy * k)
                    self.line(cx + sx * k, cy + sy * k, cx + sx * k, cy + sy * k * 0.45)
            self.line(cx - k * 0.7, cy, cx + k * 0.7, cy)

    def device_window(self, x, y, w, title, status, status_rgb, button, value, icon="lock"):
        """A device window as in the app: dark glass, status icon in the convention color."""
        def mid(box_y, box_h, size):  # y that centers a one-line cell of `size` pt in a box
            return box_y + (box_h - size * 0.5) / 2

        h = w * 0.80
        self.box(x, y, w, h, fill=GLASS, line=GLASS_LINE, r=5, lw=0.4)
        p = w * 0.07
        ts = w * 0.16
        self.text_at(x + p, y + p - 0.6, title, size=ts, bold=True, rgb=TEXT, w=w - 2 * p, lh=ts * 0.5)
        iy = y + p + w * 0.115
        ib = w * 0.075  # icon box
        self.stroke(status_rgb, 0.55)
        if icon == "lock":
            self.box(x + p, iy + ib * 0.42, ib, ib * 0.62, line=status_rgb, r=0.6, lw=0.55)
            self.line(x + p + ib * 0.25, iy + ib * 0.42, x + p + ib * 0.25, iy + ib * 0.1)
            self.line(x + p + ib * 0.75, iy + ib * 0.42, x + p + ib * 0.75, iy + ib * 0.1)
            self.line(x + p + ib * 0.25, iy + ib * 0.1, x + p + ib * 0.75, iy + ib * 0.1)
        elif icon == "tv":
            self.box(x + p, iy + ib * 0.15, ib, ib * 0.65, line=status_rgb, r=0.5, lw=0.55)
            self.line(x + p + ib * 0.3, iy + ib * 0.95, x + p + ib * 0.7, iy + ib * 0.95)
        else:  # snowflake
            cx, cy, k = x + p + ib / 2, iy + ib / 2, ib / 2
            self.line(cx - k, cy, cx + k, cy)
            self.line(cx, cy - k, cx, cy + k)
            self.line(cx - k * 0.7, cy - k * 0.7, cx + k * 0.7, cy + k * 0.7)
            self.line(cx - k * 0.7, cy + k * 0.7, cx + k * 0.7, cy - k * 0.7)
        ss = w * 0.12
        self.text_at(x + p + ib + 1.6, mid(iy, ib, ss), status, size=ss, rgb=status_rgb, w=w - 2 * p - ib, lh=ss * 0.5)
        by = iy + w * 0.13
        bh = w * 0.14
        bs = w * 0.13
        self.box(x + p, by, w - 2 * p, bh, fill=AMBER, r=bh / 2)
        self.text_at(x + p, mid(by, bh, bs), button, size=bs, bold=True, rgb=GLASS, w=w - 2 * p, align="C", lh=bs * 0.5)
        ry = by + bh + w * 0.05
        rr = w * 0.075
        ps = w * 0.17
        for cx, sign in ((x + p + rr, "-"), (x + w - p - rr, "+")):
            self.dot(cx, ry + rr, rr, fill=GLASS2)
            self.text_at(cx - rr, mid(ry, 2 * rr, ps), sign, size=ps, bold=True, rgb=TEXT, w=2 * rr, align="C", lh=ps * 0.5)
        if value:
            vs = w * 0.19
            self.text_at(x, mid(ry, 2 * rr, vs), value, size=vs, bold=True, rgb=TEXT, w=w, align="C", lh=vs * 0.5)
        # bar with the X
        bw = w * 0.66
        bh2 = w * 0.12
        bx, byy = x + (w - bw) / 2, y + h + 2.5
        fs = w * 0.1
        self.box(bx, byy, bw, bh2, fill=GLASS, line=GLASS_LINE, r=bh2 / 2, lw=0.4)
        self.text_at(bx + w * 0.05, mid(byy, bh2, fs), title, size=fs, bold=True, rgb=TEXT, w=bw - w * 0.16, lh=fs * 0.5)
        self.dot(bx + bw - w * 0.065, byy + bh2 / 2, w * 0.045, fill=GLASS2)
        self.text_at(bx + bw - w * 0.11, mid(byy, bh2, fs), "x", size=fs, bold=True, rgb=TEXT, w=w * 0.09, align="C", lh=fs * 0.5)

    def headset_view(self, x, y, w, h):
        """A passthrough view frame (rounded, light wall)."""
        self.box(x, y, w, h, fill=(214, 206, 192), line=None, r=8)
        self.fill((198, 189, 174))
        self.rect(x, y + h * 0.72, w, h * 0.28, style="F", round_corners=True, corner_radius=8)

    def cursor(self, cx, cy, r=3.2, rgb=CYAN):
        self.dot(cx, cy, r, line=rgb, lw=0.9)
        self.dot(cx, cy, r * 0.3, fill=rgb)

    def hand(self, x, y, s=1.0, rgb=(232, 196, 170)):
        """Simplified pinching hand (thumb meets index)."""
        self.fill(rgb)
        self.stroke((190, 150, 125), 0.4)
        self.rect(x, y, 14 * s, 16 * s, style="FD", round_corners=True, corner_radius=5 * s)
        self.rect(x + 9 * s, y - 9 * s, 4.2 * s, 12 * s, style="FD", round_corners=True, corner_radius=2 * s)
        self.rect(x - 4 * s, y - 2 * s, 9 * s, 4.2 * s, style="FD", round_corners=True, corner_radius=2 * s)
        self.dot(x + 9 * s, y - 2 * s, 2.2 * s, fill=AMBER)


def build() -> Guide:
    g = Guide()

    # 1 Cover
    g.add_page()
    g.fill(BG)
    g.rect(0, 0, W, H, style="F")
    g.page_no_shown = 1
    hw = W * 0.56
    hh = hw * 1152 / 2048
    g.image_fit(ILLUS / "01-sala-headset-controles-flutuantes.webp", W - M - hw, (H - hh) / 2, hw, hh)
    g.text_at(M, 34, "A.U.R.A.", size=13, bold=True, rgb=BLUE)
    g.text_at(M, 44, "Getting started", size=34, bold=True, w=W * 0.32, lh=13)
    g.text_at(M, 64, "Your home's controls, in the room with you.", size=15, rgb=MUTED, w=W * 0.3, lh=7)
    g.text_at(M, 90, "A step-by-step guide for Meta Quest: open the site, allow the camera, scan the printed tags and control each device right where it is.", size=11.5, rgb=MUTED, w=W * 0.3, lh=5.6)
    g.box(M, 118, 92, 13, fill=BLUE, r=6.5)
    g.text_at(M, 121.6, SITE, size=12, bold=True, rgb=CARD, w=92, align="C")
    g.text_at(M, H - 16, "Ambient User Responsive Automation  ·  Phase 3 prototype  ·  November 2026", size=8.5, rgb=MUTED)

    # 2 What you need
    g.slide(title="What you need", kicker="Five minutes, a headset and, optionally, a printer.")
    cards = [
        ("Meta Quest 3 or 3S", "With the Quest Browser. Hand tracking or controllers both work."),
        ("A Wi-Fi connection", f"The app runs in the browser at {SITE}. Nothing to install."),
        ("Printed tags (optional)", "Print aura-apriltags-tag36h11.pdf at 100% scale. Each tag is 11.2 cm."),
    ]
    cw = (W - 2 * M - 2 * 8) / 3
    for i, (t, b) in enumerate(cards):
        x = M + i * (cw + 8)
        g.box(x, 52, cw, 78, fill=CARD, line=LINE, r=6)
        g.dot(x + 14, 68, 7, fill=SOFT_BLUE)
        g.text_at(x + 10.6, 64.7, str(i + 1), size=12, bold=True, rgb=BLUE, w=7, align="C")
        g.text_at(x + 8, 82, t, size=14, bold=True, w=cw - 16, lh=6.2)
        g.text_at(x + 8, 98, b, size=11, rgb=MUTED, w=cw - 16, lh=5.4)
    g.tag(M + 2 * (cw + 8) + cw - 28, 108, 18, 1)
    g.callout(M, 142, W - 2 * M, "No printer?", "Everything also works with the tag icons that float in the app: pinching one stands in for scanning its printed tag.")

    # 3 Open the site
    g.slide(1, "Open the site", "In the Quest Browser, type the address and wait for the welcome page.")
    bx, by, bw, bh = M + 8, 40, 190, 120
    g.box(bx, by, bw, bh, fill=CARD, line=LINE, r=6)
    g.box(bx + 8, by + 7, bw - 16, 10, fill=BG, r=5)
    g.text_at(bx + 14, by + 9.6, "https://" + SITE, size=11, rgb=INK)
    g.text_at(bx + 12, by + 26, "Before you start", size=15, bold=True)
    g.box(bx + 12, by + 36, bw - 24, 34, fill=SOFT_BLUE, r=4)
    g.box(bx + 12, by + 76, bw - 24, 22, fill=CARD, line=BLUE, r=4, lw=0.8)
    g.text_at(bx + 18, by + 80, "1. Allow the headset camera", size=10.5, bold=True)
    g.box(bx + 18, by + 88, 34, 7, fill=BLUE, r=3.5)
    g.text_at(bx + 18, by + 89.4, "Allow camera", size=8.5, bold=True, rgb=CARD, w=34, align="C")
    g.box(bx + 12, by + 104, 52, 9, fill=BLUE, r=4.5)
    g.text_at(bx + 12, by + 106, "Continue to the app", size=9, bold=True, rgb=CARD, w=52, align="C")
    g.bullets(bx + bw + 16, 52, [
        f"Open the Quest Browser and go to {SITE}.",
        "The welcome page explains the camera, links the printable tags and this guide.",
        "Prefer Portuguese? Use the language button in the corner.",
        "Tick \"Don't show this again\" to skip it next time.",
    ], W - (bx + bw + 16) - M, size=12)

    # 4 Allow the camera (key step)
    g.slide(2, "Allow the headset camera", "Do it on the welcome page, before entering AR, so the prompt never hides behind the scene.")
    dx, dy, dw = M + 8, 42, 150
    g.box(dx, dy, dw, 104, fill=CARD, line=LINE, r=6)
    g.text_at(dx + 10, dy + 9, f"Allow {SITE} to use:", size=12.5, bold=True, w=dw - 20)
    rows = [("Headset cameras", True, "sees the room: needed to read the tags"), ("Virtual cameras", False, "your avatar only: the image stays black")]
    for i, (name, on, why) in enumerate(rows):
        ry = dy + 26 + i * 24
        g.box(dx + 10, ry, 7, 7, fill=BLUE if on else CARD, line=BLUE if on else MUTED, r=1.4, lw=0.6)
        if on:
            g.stroke(CARD, 0.9)
            g.line(dx + 11.6, ry + 3.6, dx + 13.2, ry + 5.2)
            g.line(dx + 13.2, ry + 5.2, dx + 15.6, ry + 1.8)
        g.text_at(dx + 21, ry + 0.6, name, size=12, bold=True)
        g.text_at(dx + 21, ry + 7.4, why, size=10, rgb=MUTED)
    g.box(dx + dw - 46, dy + 82, 36, 11, fill=BLUE, r=5.5)
    g.text_at(dx + dw - 46, dy + 84.4, "Allow", size=11, bold=True, rgb=CARD, w=36, align="C")
    g.box(dx + dw - 88, dy + 82, 36, 11, fill=CARD, line=LINE, r=5.5)
    g.text_at(dx + dw - 88, dy + 84.4, "Don't allow", size=11, rgb=MUTED, w=36, align="C")
    rx = dx + dw + 16
    rw = W - rx - M
    y = g.bullets(rx, 46, [
        "Press Allow camera on the welcome page.",
        "In the prompt, turn on Headset cameras. This is the one that sees your room.",
        "The page confirms: \"Headset camera allowed.\"",
    ], rw, size=12)
    g.callout(rx, y + 4, rw, "Black image in the scanner?", "Only the avatar camera was allowed. Fix it in Settings > Privacy & safety > Browser > Headset cameras, or with the lock icon next to the address, then reload.", rgb=WARN)

    # 5 Enter AR
    g.slide(3, "Enter AR", "The app opens in mixed reality: your room stays visible, the controls float in it.")
    g.headset_view(M + 8, 40, 200, 120)
    g.box(M + 8 + 70, 88, 60, 16, fill=CARD, line=BLUE, r=8, lw=0.9)
    g.text_at(M + 8 + 70, 92.4, "Enter AR", size=13, bold=True, rgb=BLUE, w=60, align="C")
    g.bullets(M + 224, 52, [
        "Press Continue to the app, then accept the browser's offer to enter AR (immersive mode).",
        "Allow the spatial permissions if asked: they let the app remember where you put things.",
        "Stand or sit facing a free wall; the interface appears about 60 cm in front of you.",
    ], W - M - 224 - M, size=12)

    # 6 Your HUD
    g.slide(4, "Meet your HUD", "Everything starts minimal: tag icons, the scan button and the gear.")
    vx, vy, vw, vh = M + 8, 38, 210, 128
    g.headset_view(vx, vy, vw, vh)
    cx = vx + vw / 2
    g.box(cx - 46, vy + 6, 92, 8, fill=GLASS, r=4)
    g.text_at(cx - 46, vy + 7.6, "90 fps  ·  11.1 ms  ·  Anchor: active", size=7.5, bold=True, rgb=CYAN, w=92, align="C")
    for i, (tid, lab) in enumerate([(1, "Living room lamp"), (2, "Living room AC"), (3, "Front door lock")]):
        g.tag_icon(cx - 62 + i * 52 - 9, vy + 30, 18, tid, lab)
    g.round_button(cx - 7, vy + 74, 5.2, "scan")
    g.round_button(cx + 7, vy + 74, 5.2, "gear")
    # labels
    lx = vx + vw + 14
    lw_ = W - lx - M
    y = 46
    for title, body in [
        ("Tag icons", "One per device. Before you scan anything they stand in for the printed tags."),
        ("Scan button", "Opens the Tag scanner: the headset camera starts reading printed tags."),
        ("Gear", "Settings: devices, interaction, HUD, audio, comfort, privacy, project phases."),
        ("Telemetry (optional)", "Frame rate and anchor status, pinned to the top of your view."),
    ]:
        g.text_at(lx, y, title, size=12.5, bold=True)
        y = g.text_at(lx, y + 6.6, body, size=10.5, rgb=MUTED, w=lw_, lh=5.2) + 5

    # 7 Point and pinch
    g.slide(5, "Point and pinch", "Aim with your hand (or controller), then pinch thumb and index to select.")
    g.headset_view(M + 8, 40, 200, 120)
    g.device_window(M + 8 + 112, 54, 64, "Living room AC", "On  ·  22°C", ICE, "Turn off", "22°C", icon="snow")
    g.hand(M + 8 + 26, 128, 1.2)
    # cursor trail from hand to button
    import math
    sx, sy, ex, ey = M + 8 + 40, 118, M + 8 + 140, 82
    for i in range(14):
        t = i / 13
        px, py = sx + (ex - sx) * t, sy + (ey - sy) * t - math.sin(t * math.pi) * 10
        rr = 0.6 + 1.8 * t
        col = tuple(int(CYAN[k] + (AMBER[k] - CYAN[k]) * t) for k in range(3))
        g.dot(px, py, rr, fill=col)
    g.cursor(ex, ey, 3.6, AMBER)
    g.bullets(M + 224, 52, [
        "A cyan ring follows your aim. Over a button it snaps to it, grows and turns amber.",
        "Pinch to press. Light, medium or firm pinch: Settings > Interaction.",
        "Controllers: aim with the ray and pull the trigger.",
    ], W - M - 224 - M, size=12)

    # 8 Try without tags
    g.slide(6, "Try it without printed tags", "Pinch a tag icon: it stands in for scanning that device's tag.")
    g.headset_view(M + 8, 40, 200, 120)
    g.tag_icon(M + 8 + 30, 60, 22, 3, "Front door lock")
    g.cursor(M + 8 + 41, 71, 3.6, AMBER)
    g.stroke(BLUE, 0.8)
    g.set_dash_pattern(dash=2, gap=2)
    g.line(M + 8 + 58, 71, M + 8 + 100, 71)
    g.set_dash_pattern()
    g.device_window(M + 8 + 104, 50, 66, "Front door lock", "Locked", RED, "Unlock", None, icon="lock")
    g.bullets(M + 224, 52, [
        "The first pinch registers the device and opens its window.",
        "Pinch the icon again (or the x under the window) to close it.",
        "Every device works the same way: lamp, air conditioner, door lock.",
    ], W - M - 224 - M, size=12)

    # 9 Print and place
    g.slide(7, "Print and place the tags", "Each printed tag is the address of one device.")
    tx = M + 8
    for i, (tid, dev) in enumerate([(1, "Lamp"), (2, "Air conditioner"), (3, "Door lock"), (10, "TV")]):
        x = tx + i * 50
        g.box(x, 42, 44, 66, fill=CARD, line=LINE, r=4)
        g.tag(x + 7, 48, 30, tid, frame=False)
        g.text_at(x, 84, f"36h11:{tid:03x}", size=9, rgb=MUTED, w=44, align="C")
        g.text_at(x, 91, f"Tag {tid}", size=12, bold=True, w=44, align="C")
        g.text_at(x, 98, dev, size=10, rgb=BLUE, w=44, align="C")
    g.bullets(tx, 120, [
        "Print aura-apriltags-tag36h11.pdf at 100% (no \"fit to page\"): the black square must measure 11.2 cm.",
        "Stick each tag flat, next to its device, at about eye level. Keep the white border around it.",
        "Good, even light helps. Avoid glossy paper that reflects lamps.",
    ], 200, size=11.5)
    g.callout(tx + 212, 42, W - (tx + 212) - M, "Which number is which?", "The label under each printed tag is hexadecimal: 00a is tag 10 (the TV), 00b is 11, 00c is 12. Tags 4 to 12, except 10, are spare.")

    # 10 Scan a tag
    g.slide(8, "Scan a tag", "Like a phone camera: look at a tag and its device appears.")
    vx, vy, vw, vh = M + 8, 38, 200, 124
    g.headset_view(vx, vy, vw, vh)
    g.tag(vx + 120, vy + 76, 20, 10)
    g.box(vx + 117, vy + 73, 26, 26, line=CYAN, r=5, lw=0.9)
    g.device_window(vx + 98, vy + 8, 64, "Living room TV", "On  ·  Volume 35", TEXT, "Turn off", "35", icon="tv")
    g.round_button(vx + 30, vy + 104, 6, "scan", active=True)
    g.text_at(vx + 18, vy + 112, "Scan: on", size=9, bold=True, rgb=INK, w=24, align="C")
    g.bullets(vx + vw + 14, 46, [
        "Pinch the scan button next to the gear: the Tag scanner opens and the camera starts.",
        "Look at a printed tag from 30 to 60 cm, the whole black square in view.",
        "Its virtual tag lands on the paper, and the device window floats above it, facing you.",
        "Pinch the virtual tag to open or close the window. Close the scanner when you are done.",
    ], W - (vx + vw + 14) - M, size=11.5)

    # 11 Your controls
    g.slide(9, "Your controls", "Each window shows the device's state with the same colors everywhere.")
    g.device_window(M + 8, 42, 74, "Front door lock", "Locked", RED, "Unlock", None, icon="lock")
    g.device_window(M + 8 + 84, 42, 74, "Front door lock", "Unlocked", GREEN, "Lock", None, icon="lock")
    g.device_window(M + 8 + 168, 42, 74, "Living room AC", "On  ·  22°C", ICE, "Turn off", "22°C", icon="snow")
    g.bullets(M + 8, 128, [
        "Door: red lock = locked, green open lock = unlocked.   Air conditioner: blue snowflake when on.",
        "The amber button does the main action (turn on, unlock); - and + change brightness, temperature or volume.",
        "The x on the bar under the window closes it. Devices are simulated in this prototype: no real device is changed.",
    ], W - 2 * M - 16, size=11.5)

    # 12 Anchors stay
    g.slide(10, "Everything stays where you put it", "Day or night, after a reload or tomorrow: the controls come back to the same spot.")
    g.image_fit(ILLUS / "02-sala-dia-e-noite-ancoras-persistentes.webp", M + 8, 40, 200, 200 / 3)
    g.bullets(M + 8, 116, [
        "The app saves a spatial anchor of your room in the headset.",
        "Reload the page or come back later: the telemetry shows \"Anchor: active (restored)\".",
        "Scanned tags are remembered for the session; after a reload, scan them again (a saved spot is planned).",
    ], 200, size=11.5)
    g.callout(M + 222, 40, W - (M + 222) - M, "Start over", "Settings > Devices > Restart app (pinch twice) brings the app back to its first state without leaving AR. Return tags to HUD puts the virtual tags back in the HUD row.")

    # 13 Settings
    g.slide(11, "Settings", "Pinch the gear. Seven sections, all saved in the browser.")
    sx0, sy0 = M + 8, 40
    g.box(sx0, sy0, 190, 116, fill=GLASS, line=GLASS_LINE, r=6, lw=0.4)
    secs = ["Devices and anchors", "Interaction", "HUD and visual", "Audio and feedback", "Comfort and access", "Privacy and data", "Project phases"]
    for i, s in enumerate(secs):
        yy = sy0 + 8 + i * 15
        g.box(sx0 + 6, yy, 54, 11, fill=AMBER if i == 0 else GLASS2, r=5.5)
        g.text_at(sx0 + 6, yy + 3, s, size=7.5, bold=True, rgb=GLASS if i == 0 else TEXT, w=54, align="C")
    for i, (n, st) in enumerate([("Living room lamp", "tag 1"), ("Living room AC", "tag 2"), ("Front door lock", "tag 3")]):
        yy = sy0 + 10 + i * 20
        g.text_at(sx0 + 68, yy, n, size=9, bold=True, rgb=TEXT)
        g.text_at(sx0 + 150, yy, st, size=8, rgb=TEXT_MUTED)
        for k, b in enumerate(["Test", "Rename", "Recalibrate", "Remove"]):
            g.box(sx0 + 68 + k * 28, yy + 6, 25, 7, fill=GLASS2, r=3.5)
            g.text_at(sx0 + 68 + k * 28, yy + 7.6, b, size=6.5, bold=True, rgb=TEXT, w=25, align="C")
    g.box(sx0 + 68, sy0 + 72, 54, 9, fill=GLASS2, r=4.5)
    g.text_at(sx0 + 68, sy0 + 74.2, "Return tags to HUD", size=7, bold=True, rgb=TEXT, w=54, align="C")
    g.box(sx0 + 126, sy0 + 72, 56, 9, fill=GLASS2, r=4.5)
    g.text_at(sx0 + 126, sy0 + 74.2, "Restart app", size=7, bold=True, rgb=RED, w=56, align="C")
    g.box(sx0 + 68, sy0 + 85, 114, 9, fill=GLASS2, r=4.5)
    g.text_at(sx0 + 68, sy0 + 87.2, "Clear all anchors", size=7, bold=True, rgb=RED, w=114, align="C")
    g.bullets(sx0 + 204, 44, [
        "Language: English, Português, Español, Français, Deutsch.",
        "Interaction: pinch sensitivity, magnetic snap, activation range.",
        "HUD: Follow my view, card size, opacity, telemetry.",
        "Comfort: standing or seated height, high contrast.",
        "Quit: the button on the Settings bar leaves AR.",
    ], W - (sx0 + 204) - M, size=11)

    # 14 Troubleshooting
    g.slide(title="Troubleshooting", kicker="The usual suspects, and what to do.")
    rows = [
        ("The scanner image is black", "Only the avatar camera is allowed. Turn on Settings > Privacy & safety > Browser > Headset cameras, then reload."),
        ("The camera prompt never appeared", "Leave AR, reload the page and press Allow camera on the welcome page (or use the lock icon next to the address)."),
        ("A tag is not read", "Get closer (30 to 60 cm), keep the whole black square and its white border in view, add light, avoid reflections."),
        ("The virtual tag is a bit off the paper", "Keep the scanner open a second longer while you hold still: each read refines the position."),
        ("Something feels stuck", "Settings > Devices > Restart app (pinch twice), or Quit and enter AR again."),
    ]
    y = 38
    for q, a in rows:
        g.box(M, y, W - 2 * M, 22, fill=CARD, line=LINE, r=4)
        g.text_at(M + 8, y + 4.4, q, size=12, bold=True, w=90, lh=5.6)
        g.text_at(M + 104, y + 4.4, a, size=11, rgb=MUTED, w=W - 2 * M - 112, lh=5.4)
        y += 26

    # 15 What's next
    g.add_page()
    g.fill(BG)
    g.rect(0, 0, W, H, style="F")
    g.page_no_shown += 1
    gw = W * 0.5
    gh = gw * 1280 / 1920
    g.image_fit(ILLUS / "03-oculos-inteligentes-corredor-porta.webp", W - M - gw, (H - gh) / 2, gw, gh)
    g.text_at(M, 34, "What's next", size=13, bold=True, rgb=BLUE)
    g.text_at(M, 44, "From the headset to everyday glasses.", size=24, bold=True, w=W * 0.44, lh=10)
    g.bullets(M, 74, [
        "Tags remembered across sessions, scanning always on, no window needed.",
        "More devices following the same color code: gates, garage, heating, blinds, speakers, cameras.",
        "Real devices through Matter, and lighter glasses for the same controls.",
    ], W * 0.42, size=12)
    g.text_at(M, H - 16, f"A.U.R.A.  ·  {SITE}", size=9, rgb=MUTED)
    return g


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    build().output(str(OUT))
    PUBLIC_OUT.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(OUT, PUBLIC_OUT)
    print(f"wrote {OUT}\ncopied to {PUBLIC_OUT}")


if __name__ == "__main__":
    main()
