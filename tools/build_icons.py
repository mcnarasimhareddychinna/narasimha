"""Build the app icons (favicon PNGs, Apple touch icon, PWA icons incl. maskable).

Run: python tools/build_icons.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "img" / "icons"
OUT.mkdir(parents=True, exist_ok=True)
FONT = "C:/Windows/Fonts/georgiab.ttf"
C0, C1, C2 = (0x34, 0x46, 0xD4), (0x5A, 0x6A, 0xF0), (0xE0, 0x7A, 0x3F)


def gradient(size: int) -> Image.Image:
    """Diagonal indigo -> violet -> saffron gradient, same as favicon.svg."""
    im = Image.new("RGB", (size, size))
    px = im.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * size - 2)
            if t < 0.62:
                k = t / 0.62
                c = tuple(round(C0[i] + (C1[i] - C0[i]) * k) for i in range(3))
            else:
                k = (t - 0.62) / 0.38
                c = tuple(round(C1[i] + (C2[i] - C1[i]) * k) for i in range(3))
            px[x, y] = c
    return im


def monogram(size: int, text_scale: float) -> Image.Image:
    im = gradient(size)
    d = ImageDraw.Draw(im)
    f = ImageFont.truetype(FONT, round(size * text_scale))
    d.text((size / 2, size / 2 + size * 0.012), "NR", font=f, fill="white", anchor="mm")
    return im


def rounded(im: Image.Image, radius_ratio: float) -> Image.Image:
    size = im.width
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=round(size * radius_ratio), fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(im, (0, 0), mask)
    return out


master = monogram(1024, 0.42)          # "any" purpose: big letters, rounded corners
maskable = monogram(1024, 0.30)        # maskable: letters inside the 80% safe zone, full bleed

rounded(master, 0.22).resize((512, 512), Image.LANCZOS).save(OUT / "icon-512.png", optimize=True)
rounded(master, 0.22).resize((192, 192), Image.LANCZOS).save(OUT / "icon-192.png", optimize=True)
maskable.resize((512, 512), Image.LANCZOS).save(OUT / "maskable-512.png", optimize=True)
maskable.resize((192, 192), Image.LANCZOS).save(OUT / "maskable-192.png", optimize=True)
master.resize((180, 180), Image.LANCZOS).save(ROOT / "assets" / "img" / "apple-touch-icon.png", optimize=True)
rounded(master, 0.22).resize((32, 32), Image.LANCZOS).save(OUT / "favicon-32.png", optimize=True)

for p in sorted(OUT.iterdir()):
    print(p.relative_to(ROOT), p.stat().st_size)
