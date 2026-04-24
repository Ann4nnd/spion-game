#!/usr/bin/env python3
"""Bold geometric avatar — colorful gradient background."""

from PIL import Image, ImageDraw, ImageFilter
import math

RENDER = 1024
SIZE = 512
CENTER = RENDER // 2

TEAL = (72, 209, 204)
CORAL = (235, 120, 100)
GOLD = (212, 178, 80)
VIOLET = (160, 100, 220)
ROSE = (220, 90, 160)

def hexagon_points(cx, cy, radius, rotation=0):
    return [(cx + radius * math.cos(math.radians(60*i+rotation)),
             cy + radius * math.sin(math.radians(60*i+rotation))) for i in range(6)]

def triangle_points(cx, cy, radius, rotation=0):
    return [(cx + radius * math.cos(math.radians(120*i+rotation-90)),
             cy + radius * math.sin(math.radians(120*i+rotation-90))) for i in range(3)]

def lerp(a, b, t):
    return int(a + (b - a) * t)

def main():
    # === Colorful gradient background ===
    # 4 corners: deep purple, dark teal, midnight blue, dark rose
    c_tl = (30, 15, 60)    # top-left: purple
    c_tr = (10, 40, 50)    # top-right: teal
    c_bl = (50, 15, 35)    # bottom-left: rose
    c_br = (12, 20, 55)    # bottom-right: blue

    bg = Image.new("RGB", (RENDER, RENDER))
    for y in range(RENDER):
        ty = y / RENDER
        for x in range(RENDER):
            tx = x / RENDER
            # Bilinear interpolation of 4 corner colors
            top_r = lerp(c_tl[0], c_tr[0], tx)
            top_g = lerp(c_tl[1], c_tr[1], tx)
            top_b = lerp(c_tl[2], c_tr[2], tx)
            bot_r = lerp(c_bl[0], c_br[0], tx)
            bot_g = lerp(c_bl[1], c_br[1], tx)
            bot_b = lerp(c_bl[2], c_br[2], tx)
            r = lerp(top_r, bot_r, ty)
            g = lerp(top_g, bot_g, ty)
            b = lerp(top_b, bot_b, ty)
            bg.putpixel((x, y), (r, g, b))

    # === Color glows ===
    glow = Image.new("RGBA", (RENDER, RENDER), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    # Teal glow top
    for r in range(350, 0, -4):
        a = int(14 * (1 - r / 350))
        gd.ellipse([CENTER-r, -100-r+CENTER, CENTER+r, -100+r+CENTER], fill=(*TEAL, a))
    # Rose glow bottom-left
    for r in range(300, 0, -4):
        a = int(12 * (1 - r / 300))
        gd.ellipse([CENTER-300-r, CENTER+150-r, CENTER-300+r, CENTER+150+r], fill=(*ROSE, a))
    # Violet glow right
    for r in range(300, 0, -4):
        a = int(10 * (1 - r / 300))
        gd.ellipse([CENTER+250-r, CENTER-r, CENTER+250+r, CENTER+r], fill=(*VIOLET, a))
    # Gold center glow
    for r in range(200, 0, -3):
        a = int(12 * (1 - r / 200))
        gd.ellipse([CENTER-r, CENTER-r, CENTER+r, CENTER+r], fill=(*GOLD, a))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=60))

    # === Main layer ===
    layer = Image.new("RGBA", (RENDER, RENDER), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    # White lines stand out better on colorful bg
    WHITE = (255, 255, 255)

    # Outer hexagon — TEAL
    pts = hexagon_points(CENTER, CENTER, 380, rotation=0)
    draw.polygon(pts, fill=(*TEAL, 8), outline=(*TEAL, 200), width=8)

    # Second hexagon rotated — VIOLET
    pts2 = hexagon_points(CENTER, CENTER, 380, rotation=30)
    draw.polygon(pts2, outline=(*VIOLET, 120), width=4)

    # Inner hexagon — CORAL
    pts3 = hexagon_points(CENTER, CENTER, 280, rotation=0)
    draw.polygon(pts3, fill=(*CORAL, 10), outline=(*CORAL, 180), width=6)

    # Central hexagon — GOLD
    pts4 = hexagon_points(CENTER, CENTER, 160, rotation=0)
    draw.polygon(pts4, fill=(*GOLD, 20), outline=(*GOLD, 220), width=5)

    # Upper triangle — TEAL
    tri_up = triangle_points(CENTER, CENTER - 12, 110, rotation=0)
    draw.polygon(tri_up, fill=(*TEAL, 25), outline=(*TEAL, 230), width=5)

    # Lower triangle — ROSE
    tri_down = triangle_points(CENTER, CENTER + 12, 110, rotation=180)
    draw.polygon(tri_down, fill=(*ROSE, 25), outline=(*ROSE, 230), width=5)

    # Central diamond — GOLD filled
    dw, dh = 40, 55
    diamond = [(CENTER, CENTER-dh), (CENTER+dw, CENTER), (CENTER, CENTER+dh), (CENTER-dw, CENTER)]
    draw.polygon(diamond, fill=(*GOLD, 120), outline=(*GOLD, 255), width=4)

    # Central circle — CORAL
    cr = 28
    draw.ellipse([CENTER-cr, CENTER-cr, CENTER+cr, CENTER+cr],
                 fill=(*CORAL, 220), outline=(*WHITE, 255), width=3)

    # Dark pupil
    pr = 10
    draw.ellipse([CENTER-pr, CENTER-pr, CENTER+pr, CENTER+pr],
                 fill=(15, 12, 25, 255))

    # Highlight
    draw.ellipse([CENTER-14, CENTER-16, CENTER-6, CENTER-8],
                 fill=(255, 240, 220, 160))

    # Outer hex vertex dots — alternating
    colors_outer = [TEAL, VIOLET, TEAL, VIOLET, TEAL, VIOLET]
    for i, p in enumerate(pts):
        draw.ellipse([p[0]-9, p[1]-9, p[0]+9, p[1]+9], fill=(*colors_outer[i], 220))

    # Inner hex vertex dots
    colors_inner = [CORAL, GOLD, ROSE, CORAL, GOLD, ROSE]
    for i, p in enumerate(pts3):
        draw.ellipse([p[0]-7, p[1]-7, p[0]+7, p[1]+7], fill=(*colors_inner[i], 190))

    # Radial lines — VIOLET
    for i in range(12):
        angle = math.radians(30 * i)
        x1 = CENTER + 170 * math.cos(angle)
        y1 = CENTER + 170 * math.sin(angle)
        x2 = CENTER + 270 * math.cos(angle)
        y2 = CENTER + 270 * math.sin(angle)
        draw.line([(x1, y1), (x2, y2)], fill=(*VIOLET, 50), width=3)

    # === Compose and downscale ===
    result = bg.convert("RGBA")
    result = Image.alpha_composite(result, glow)
    result = Image.alpha_composite(result, layer)
    result = result.resize((SIZE, SIZE), Image.LANCZOS)

    output = "/Users/anna/Desktop/Claude/Spion/bot-avatar.png"
    result.save(output, "PNG")
    print(f"Saved: {output}")

if __name__ == "__main__":
    main()
