#!/usr/bin/env python3
"""Smooth-edged crops and privacy redaction for app screenshots.

  crop.py rect   <src> <out> <x> <y> <w> <h> [radius]     rounded rectangle (radius 0 = square)
  crop.py pill   <src> <out> <x> <y> <w> <h>              radius = h/2
  crop.py circle <src> <out> <cx> <cy> <r>
  crop.py screen <src> <out> <width>                       resize a full screen (e.g. 752 = 2x a 376px phone screen)
  crop.py redact <src> <out> <x> <y> <w> <h> [text] [size] [weight] [align]
        erase a box with the colour sampled just outside it, and optionally draw dummy text
        (Rubik from the kit, RTL); align = right|left|center (default right)

Masks are drawn at 4x and downsampled with LANCZOS so curved edges stay smooth.
"""
import sys, os
from PIL import Image, ImageDraw, ImageFont

SS = 4
HERE = os.path.dirname(os.path.abspath(__file__))
# put rubik-hebrew-<weight>-normal.woff2 (npm @fontsource/rubik) in a fonts/ folder next to this script
FONT_DIRS = [os.path.join(HERE, "fonts"), os.path.join(HERE, "..", "fonts")]


def mask_rounded(w, h, r):
    m = Image.new("L", (w * SS, h * SS), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, w * SS - 1, h * SS - 1], radius=r * SS, fill=255)
    return m.resize((w, h), Image.LANCZOS)


def mask_circle(d):
    m = Image.new("L", (d * SS, d * SS), 0)
    ImageDraw.Draw(m).ellipse([0, 0, d * SS - 1, d * SS - 1], fill=255)
    return m.resize((d, d), Image.LANCZOS)


def cut(img, box, mask):
    out = img.crop(box).convert("RGBA")
    out.putalpha(mask)
    return out


def font(size, weight):
    name = f"rubik-hebrew-{weight}-normal.woff2"
    for d in FONT_DIRS:
        p = os.path.join(d, name)
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size, layout_engine=ImageFont.Layout.RAQM)
            except Exception:
                return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def main(a):
    op, src, out = a[0], a[1], a[2]
    img = Image.open(src).convert("RGBA")
    n = [int(float(v)) for v in a[3:7] if v.lstrip("-").replace(".", "").isdigit()]
    if op in ("rect", "pill"):
        x, y, w, h = n[:4]
        r = h // 2 if op == "pill" else (int(a[7]) if len(a) > 7 else 0)
        res = cut(img, (x, y, x + w, y + h), mask_rounded(w, h, r))
    elif op == "circle":
        cx, cy, r = n[:3]
        res = cut(img, (cx - r, cy - r, cx + r, cy + r), mask_circle(2 * r))
    elif op == "screen":
        W = int(a[3])
        res = img.resize((W, round(img.height * W / img.width)), Image.LANCZOS)
    elif op == "redact":
        x, y, w, h = n[:4]
        res = img.copy()
        sx, sy = max(0, x - 3), min(img.height - 1, y + h // 2)
        bg = img.getpixel((sx, sy))
        ImageDraw.Draw(res).rectangle([x, y, x + w, y + h], fill=bg)
        if len(a) > 7 and a[7]:
            size = int(a[8]) if len(a) > 8 else int(h * 0.7)
            weight = a[9] if len(a) > 9 else "500"
            align = a[10] if len(a) > 10 else "right"
            f = font(size, weight)
            d = ImageDraw.Draw(res)
            lum = 0.299 * bg[0] + 0.587 * bg[1] + 0.114 * bg[2]
            col = (20, 20, 22, 255) if lum > 140 else (245, 245, 245, 255)
            kw = {"direction": "rtl"} if any("֐" <= ch <= "׿" for ch in a[7]) else {}
            try:
                tw = d.textlength(a[7], font=f, **kw)
            except Exception:
                tw = d.textlength(a[7], font=f)
            tx = x + w - tw if align == "right" else x if align == "left" else x + (w - tw) / 2
            try:
                d.text((tx, y + (h - size) / 2), a[7], font=f, fill=col, **kw)
            except Exception:
                d.text((tx, y + (h - size) / 2), a[7], font=f, fill=col)
    else:
        sys.exit(__doc__)
    res.save(out)
    print(out, res.size)


if __name__ == "__main__":
    if len(sys.argv) < 4:
        sys.exit(__doc__)
    main(sys.argv[1:])
