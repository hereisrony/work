#!/usr/bin/env python3
"""Draw the site's mark: the favicons and the card that opens a shared link.

    python3 tools/make-icons.py

Needs Pillow, which build.py deliberately does not — the build stays
stdlib-only, so the icons are drawn once here and committed. Run it if the
accent changes, or if the mark does.

The mark is ◩: a square outline with its left half filled. Every measurement
is a fraction of the tile, taken from assets/favicon.svg, so it draws the same
at any size.
"""

from PIL import Image, ImageDraw

ACCENT = (0, 255, 51)          # #00FF33
WHITE = (255, 255, 255)
SS = 8                         # draw large, then reduce: clean edges at 32px

# fractions of the tile, from the 32-unit viewBox in favicon.svg
INSET, SIDE, STROKE = 3 / 32, 26 / 32, 3 / 32
HALF_X, HALF_Y, HALF_W, HALF_H = 4.5 / 32, 4.5 / 32, 11.5 / 32, 23 / 32


def mark(size, colour=ACCENT):
    """The mark on transparency, at `size` pixels square."""
    n = size * SS
    img = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([INSET * n, INSET * n, (INSET + SIDE) * n, (INSET + SIDE) * n],
                outline=colour, width=max(1, round(STROKE * n)))
    d.rectangle([HALF_X * n, HALF_Y * n,
                 (HALF_X + HALF_W) * n, (HALF_Y + HALF_H) * n], fill=colour)
    return img.resize((size, size), Image.LANCZOS)


def write(path, img):
    img.save(path, optimize=True)
    print("%-38s %s" % (path, "x".join(str(v) for v in img.size)))


# the tab, and the icon a phone keeps on its home screen
write("assets/favicon.png", mark(32))
write("assets/apple-touch-icon.png",
      Image.alpha_composite(Image.new("RGBA", (180, 180), WHITE + (255,)),
                            mark(180)).convert("RGB"))

# the card a shared link opens with: the mark on the site's own white paper,
# at the 1.91:1 the platforms crop to
CARD = (1200, 630)
card = Image.new("RGB", CARD, WHITE)
m = mark(300)
card.paste(m, ((CARD[0] - 300) // 2, (CARD[1] - 300) // 2), m)
write("assets/img/mark-card.png", card)

# and the stylesheet's own copy of the mark, so the accent lives in one place
open("assets/favicon.svg", "w").write(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">\n'
    '  <rect x="3" y="3" width="26" height="26" fill="none" '
    'stroke="#00FF33" stroke-width="3"/>\n'
    '  <rect x="4.5" y="4.5" width="11.5" height="23" fill="#00FF33"/>\n'
    '</svg>\n')
print("%-38s %s" % ("assets/favicon.svg", "#00FF33"))
