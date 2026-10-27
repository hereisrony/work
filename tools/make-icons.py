#!/usr/bin/env python3
"""Cut the site's mark down to the favicons and the card that opens a shared link.

    python3 tools/make-icons.py

Needs Pillow, which build.py deliberately does not — the build stays
stdlib-only, so the icons are made once here and committed. Run it if the
mark changes.

The mark is a black stone on the accent, the same one rony.blog carries.
assets/img/mark.png is the master, 1024px square; everything else is reduced
from it.
"""

from PIL import Image

ACCENT = (0, 255, 51)          # #00FF33, the ground the master is drawn on
MASTER = Image.open("assets/img/mark.png").convert("RGB")


def mark(size):
    """The master, at `size` pixels square."""
    return MASTER.resize((size, size), Image.LANCZOS)


def write(path, img):
    img.save(path, optimize=True)
    print("%-38s %s" % (path, "x".join(str(v) for v in img.size)))


# the tab icon. Google only shows a favicon whose side is a multiple of 48px
# (and at least 48), so it is 192 rather than 64; browsers scale it down.
# /favicon.ico is the fallback crawlers look for at the root unasked.
write("assets/favicon.png", mark(192))
MASTER.save("favicon.ico", sizes=[(48, 48), (96, 96)])
print("%-38s 48x48, 96x96" % "favicon.ico")
# the icon a phone keeps on its home screen
write("assets/apple-touch-icon.png", mark(180))

# the card a shared link opens with: the master's green runs to the edges, so
# the square sits in a field of the same green at the 1.91:1 the platforms
# crop to
CARD = (1200, 630)
card = Image.new("RGB", CARD, ACCENT)
card.paste(mark(CARD[1]), ((CARD[0] - CARD[1]) // 2, 0))
write("assets/img/mark-card.png", card)
