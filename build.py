#!/usr/bin/env python3
"""Build ronyefrat.work into static HTML for GitHub Pages.

    python3 build.py

Content lives in content/posts.json and content/pages.json; everything the
browser needs ends up in the repo root and assets/. There is no other
toolchain — the output is plain HTML you can also edit by hand.
"""

import hashlib
import html as htmllib
import json
import os
import re
import shutil

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = "https://www.ronyefrat.work"
TITLE = "Rony Efrat"
TAGLINE = "technology is the campfire around which we tell our stories."
QUOTE_BY = "Laurie Anderson"

# The line has always been Laurie Anderson's; the sidebar now says so. No
# quotation marks, no dash — the attribution is set apart by weight and space.
QUOTE = ('<figure class="header-description">'
         '<blockquote><p>%s</p></blockquote>'
         '<figcaption>%s</figcaption>'
         '</figure>' % (TAGLINE, QUOTE_BY))

# Every text page, in the order they were written.
PAGES = [
    ("/upcoming/", "upcoming"),
    ("/about/", "about"),
    ("/filmography/", "filmography"),
    ("/academia/", "academia"),
    ("/ai/", "ai"),
    ("/press/", "press"),
]

# The menu is those pages minus upcoming: the front page already opens on what
# is coming and carries "more upcoming" through to the rest, so a second way in
# from the sidebar only says the same thing twice. The page stays where it is,
# in the sitemap and in the feed.
NAV = [(h, l) for h, l in PAGES if h != "/upcoming/"]

# What a shared link opens with. (path, width, height) — the dimensions let a
# platform lay the card out before the image arrives.
#
# Tra il dire e il fare stands for the work, so it carries every page but one.
SOCIAL_IMAGE = ("/assets/img/traildire-960.jpg", 960, 956)
# The front page is the site rather than any one piece, so it carries the mark
# instead: the same ◩ as the tab icon, on the site's own white paper.
HOME_SOCIAL_IMAGE = ("/assets/img/mark-card.png", 1200, 630)

ROLE = "french filmmaker and artist"

# Written by her, used as-is. Keyed by the page's path.
SEO = {
    "/": ("Rony Efrat is a French multimedia artist, researcher and educator, "
          "working across film, language, technology and systems."),
    "/about/": ("Rony Efrat is a filmmaker, artist, researcher and educator whose "
                "practice moves between cinema, language, archives, technology and "
                "public systems. Her work has been presented by ARTE, France "
                "T\u00e9l\u00e9visions, Le Fresnoy, ADAGP and the Venice "
                "Architecture Biennale."),
    "/upcoming/": ("Upcoming screenings, talks, conferences, exhibitions and public "
                   "events with Rony Efrat. Current appearances include Sciences Po, "
                   "ADAGP, festivals and institutions in France and internationally."),
    "/filmography/": ("Films by filmmaker and writer-director Rony Efrat, including "
                      "Failing Forward, Une vie en France and Exceptional Talent. Her "
                      "filmography spans fiction, documentary, hybrid cinema, "
                      "interactive work and writing for ARTE, France "
                      "T\u00e9l\u00e9visions and independent productions."),
    "/academia/": ("Research and teaching by Rony Efrat across systems theory, "
                   "sociolinguistics, technology, migration and belonging. She "
                   "teaches at Sciences Po and has worked across academic research, "
                   "public policy and higher education in France and "
                   "internationally."),
    "/ai/": ("Rony Efrat\u2019s work with generative systems examines synthetic "
             "images and the ways technology reorganizes perception, representation "
             "and authority. She develops experimental production pipelines while "
             "using technical practice as a way to understand and critique the "
             "systems themselves."),
    "/press/": ("Interviews and critical writing on Rony Efrat\u2019s films, "
                "exhibitions, research and work with technology. Selected coverage "
                "includes Arte, Forbes, Esprit, Fisheye, Hyperallergic and "
                "Lib\u00e9ration."),
}

# And hers for each project, keyed by slug. Every project has one; the
# assembled fallback below is only there so a new project is never left
# without a description.
WORK_SEO = {
    "une-vie-en-france":
        "A one-minute biographical series for France Télévisions about "
        "figures whose lives reshaped France through migration.",
    "failing-forward":
        "A short fiction film exploring the shifting border between "
        "language, family archives and artificial intelligence.",
    "exemplaires":
        "A short fiction film set in Paris in 2017, where three migrant "
        "women face the arbitrary cancellation of their residence permits.",
    "tech-care":
        "A talk on technology, memory and storytelling for researchers, "
        "policymakers, artists and communities.",
    "strike-against-the-archive":
        "A multi-screen installation on family memory, national narratives "
        "and technology, built from interviews with Rony Efrat’s parents.",
    "from-accents-to-ai":
        "A talk at Concordia University on language standardization through "
        "technology.",
    "coupdecoeur":
        "A site-specific video tour for the Historical Library of Paris, "
        "created for the European Heritage Days.",
    "multilingual":
        "A workshop on creative translation in theatre and performance "
        "through multilingual, collaborative practice.",
    "escalesliees":
        "IGLOÙ’s 2018 edition brought together artists from different "
        "backgrounds between Venice Architecture Biennale and Parc de La "
        "Villette.",
    "toutdonnees":
        "IGLOÙ’s second annual event transformed DOC in Paris into a "
        "weekend of digital art and multisensory experiences.",
    "premiersejour":
        "The first edition of IGLOÙ gathered artists and writers for a "
        "site-specific festival of performance and installation.",
    "sonicmuseum":
        "A series of immersive audio guides for the Louvre Museum combining "
        "sound, experimental audio and localization.",
    "clefsdame":
        "An interactive Exquisite Corpse performance where personal "
        "memories are transformed through homophonic translation.",
    "coincidence":
        "A long-distance storytelling project by Ariel Abrahams and Rony "
        "Efrat, created before the collaborators met in person.",
    "falsefriends":
        "A bilingual performance about faux amis, words that sound alike "
        "across languages but carry different meanings.",
    "failure":
        "A performance and text on failure, desire and repetition told "
        "through fragmented language and the recurring figure of the wolf.",
    "traildire":
        "A trilingual performance, three attempts to reach a memory "
        "suspended between video, sound and water.",
    "homecheck":
        "An interactive performance using digital tools to stage a virtual "
        "home visit and explore distance, presence and mediation.",
}

SOCIAL = [
    ("https://www.instagram.com/hereisrony/", "Instagram",
     'M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.9 5.9 0 0 0-2.13 1.38A5.9 5.9 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.38 2.13a5.9 5.9 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.9 5.9 0 0 0 2.13-1.38 5.9 5.9 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.9 5.9 0 0 0-1.38-2.13A5.9 5.9 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0z M12 5.84A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zM19.85 5.6a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0z'),
    ("mailto:rony@karmalab.tech", "Email",
     'M2 4h20a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm10 8.13L3.5 6.2V18h17V6.2L12 12.13zM12 10.1 20.3 5H3.7L12 10.1z'),
    ("https://www.behance.net/hereisrony", "Behance",
     'M7.44 4.9c.72 0 1.37.06 1.96.19.59.12 1.1.32 1.51.6.42.28.74.66.97 1.13.23.47.34 1.06.34 1.75 0 .75-.17 1.38-.51 1.88-.34.5-.85.91-1.52 1.23.92.26 1.6.72 2.06 1.38.45.66.68 1.45.68 2.38 0 .75-.15 1.4-.44 1.95-.29.55-.68 1-1.17 1.34-.49.35-1.06.6-1.7.77-.63.16-1.29.24-1.96.24H0V4.9h7.44zm-.44 5.63c.6 0 1.09-.14 1.47-.42.38-.28.57-.74.57-1.38 0-.35-.06-.64-.19-.87a1.35 1.35 0 0 0-.51-.53 2.2 2.2 0 0 0-.74-.26 4.9 4.9 0 0 0-.87-.07H3.3v3.53h3.7zm.2 5.92c.33 0 .65-.03.95-.1.3-.06.57-.17.8-.32.23-.15.41-.36.55-.62.13-.26.2-.6.2-1.01 0-.8-.22-1.37-.67-1.71-.45-.34-1.05-.51-1.79-.51H3.3v4.27h3.9zM17.5 16.9c.45.43 1.09.65 1.93.65.6 0 1.12-.15 1.55-.45.43-.3.7-.62.8-.95h2.42c-.39 1.2-.98 2.06-1.78 2.58-.8.51-1.77.77-2.9.77-.79 0-1.5-.13-2.13-.38a4.4 4.4 0 0 1-1.6-1.08 4.8 4.8 0 0 1-1.02-1.67 6.2 6.2 0 0 1-.36-2.15c0-.77.12-1.48.37-2.13a5 5 0 0 1 1.05-1.69 4.9 4.9 0 0 1 3.7-1.5c.83 0 1.56.16 2.18.48.62.32 1.13.75 1.53 1.29.4.54.69 1.16.86 1.85.17.7.23 1.42.18 2.18h-7.09c.04.96.28 1.66.73 2.09zm3.37-5.66c-.36-.39-.9-.59-1.63-.59-.48 0-.87.08-1.19.24-.31.16-.56.36-.75.6-.19.24-.32.49-.4.75-.07.27-.11.5-.13.71h4.4c-.13-.69-.35-1.21-.7-1.6zM15.6 5.9h5.5v1.34h-5.5V5.9z'),
    ("https://www.linkedin.com/in/hereisrony/", "LinkedIn",
     'M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zm1.78 13.02H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z'),
]

JSONLD = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Rony Efrat",
    "url": SITE,
    "alternateName": "Rony Férat",
    "jobTitle": "Filmmaker, Artist, Researcher and Educator",
    "nationality": {"@type": "Country", "name": "France"},
    "image": SITE + SOCIAL_IMAGE[0],
    "homeLocation": {"@type": "Place", "name": "Paris, France"},
    "worksFor": {"@type": "Organization", "name": "KarmaLab",
                 "url": "https://www.karmalab.tech"},
    "description": SEO["/"],
    "alumniOf": {
        "@type": "CollegeOrUniversity",
        "name": "Le Fresnoy – Studio national des arts contemporains",
    },
    "award": [
        "Digital Art Revelation Award 2024 – ADAGP",
        "Médaille de la Ville de Paris (2018)",
    ],
    "knowsLanguage": ["fr", "en", "it"],
    "sameAs": [
        "https://www.imdb.com/name/nm15203874/",
        "https://www.lefresnoy.net/en/ecole/etudiant/551/",
        "https://www.linkedin.com/in/hereisrony",
        "https://www.instagram.com/hereisrony/",
    ],
}


def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;")
             .replace(">", "&gt;").replace('"', "&quot;"))


SEP = "\u22ee"          # the separator she asked for, not a dash


def tab_title(name=None):
    """Lower case, no dash, and never the subtitle: "name \u22ee rony efrat"."""
    if not name:
        return TITLE.lower()
    return "%s %s %s" % (name.split(" \u2014 ")[0].strip().lower(), SEP, TITLE.lower())


def strip_tags(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s)).strip()


# A body usually opens with nothing but a link — "find it here." — which tells
# a search engine nothing, so descriptions skip it and start at the writing.
_OPENING_LINK = re.compile(
    r"^(?:\s|<p>|</p>|<br\s*/?>|<a\b[^>]*>.*?</a>|[.\u2026,;:]\s*)+", re.S)


def prose(s):
    """The running text of a body, as a reader would say it aloud."""
    text = strip_tags(_OPENING_LINK.sub("", s))
    # Bodies carry HTML entities (&oelig;, &Ugrave;); a description wants the
    # letters themselves, and esc() re-escapes what needs it on the way out.
    return re.sub(r"\s+", " ", htmllib.unescape(text)).strip()


def work_seo(p):
    """What a project says about itself to a search engine.

    Hers, where she wrote one — which is everywhere today. A project added
    later falls back to its own opening line, named and placed, so it is never
    left with nothing.
    """
    written = WORK_SEO.get(p["slug"])
    if written:
        return written
    return "%s by %s, %s. %s" % (
        p["title"].split(" \u2014 ")[0].strip().lower(),
        TITLE, ROLE, prose(p["body"])[:130])


def page_body(href, body):
    """A text page's body, ready to write."""
    html = tidy_headings(lazy_iframes(strip_inline_styles(body)))
    if href == "/upcoming/":
        html = one_list(html)
    return mark_dates(html)


def tidy_headings(html):
    """Headings the old build left behind.

    One on the press page holds nothing but a non-breaking space inside a link
    to an emoji page — it rendered as air, and now that a heading carries a
    green band it renders as a green swatch. Another opens with a line break
    before its word, which puts an empty line inside the band. Neither is
    content, so both go.
    """
    def fix(m):
        inner = m.group(2)
        if not strip_tags(htmllib.unescape(inner)).strip():
            return ""                       # a heading with nothing in it
        inner = re.sub(r"^(?:\s|<br\s*/?>)+", "", inner)
        inner = re.sub(r"(?:\s|<br\s*/?>)+$", "", inner)
        return "<%s>%s</%s>" % (m.group(1), inner, m.group(1))

    return re.sub(r"<(h[1-6])(?:\s[^>]*)?>(.*?)</\1>", fix, html, flags=re.S)


def one_list(body):
    """The upcoming page as a single run of dates, newest first.

    It was written in two halves — what is coming, in the order it arrives,
    and then P A S T counting back. One list reads the same whether an event
    has happened or not, so the divider goes and everything sorts by date, the
    newest at the top. Each entry comes out in its own paragraph, which also
    tidies the line breaks the old build left between them.
    """
    hits = date_markers(body)
    if not hits:
        return body
    divider = body.find("P A S T")

    entries = []
    for i, mark in enumerate(hits):
        month = next((k for k, name in enumerate(MONTH_NAMES, 1)
                      if name.startswith(mark.group(2).lower()[:3])), 0)
        end = hits[i + 1].start() if i + 1 < len(hits) else len(body)
        if mark.end() < divider < end:
            end = divider              # the divider is not part of the entry
        entries.append(((int(mark.group(1)), month, int(mark.group(3))),
                        mark.group(0), tidy_entry(body[mark.end():end])))

    entries.sort(key=lambda e: e[0], reverse=True)
    return "".join("<p>%s%s</p>" % (marker, text)
                   for _, marker, text in entries if text)


def tidy_entry(html):
    """One entry with the paragraph scaffolding taken off.

    Entries were separated by line breaks, sometimes inside the anchor that
    ended them, and Tumblr left empty tags behind. None of that survives being
    put in a paragraph of its own.
    """
    html = re.sub(r"</?p>", " ", html)
    for _ in range(4):                 # each pass can uncover the next
        html = re.sub(r"(?:\s|&nbsp;|<br\s*/?>)+$", "", html.strip())
        html = re.sub(r"(?:\s|&nbsp;|<br\s*/?>)+(?=(?:</[a-z]+>)+$)", "", html)
        html = re.sub(r"<a\b[^>]*>\s*</a>$", "", html)
        html = re.sub(r"<(strong|i|em|b)>\s*</\1>$", "", html)
        # an opening tag with nothing after it — the last entry before the old
        # divider ended on the <strong> that used to open it
        html = re.sub(r"<(?:a|strong|em|i|b|span|u|small)\b[^>]*>\s*$", "", html)
    return re.sub(r"\s+", " ", html).strip()


def lazy_iframes(html):
    """Defer third-party embeds until they are scrolled to."""
    return re.sub(r"<iframe(?![^>]*loading=)", '<iframe loading="lazy"', html)


# Each player is asked for as little chrome as the host allows: no title, no
# byline, no avatar, no related videos.
VIDEO_HOSTS = (
    (re.compile(r"^https?://(?:www\.)?vimeo\.com/(\d+)"),
     "https://player.vimeo.com/video/%s"
     "?title=0&byline=0&portrait=0&dnt=1&autoplay=1"),
    (re.compile(r"^https?://(?:www\.)?youtube\.com/watch\?v=([\w-]+)"),
     "https://www.youtube-nocookie.com/embed/%s"
     "?autoplay=1&modestbranding=1&rel=0&playsinline=1"),
    (re.compile(r"^https?://youtu\.be/([\w-]+)"),
     "https://www.youtube-nocookie.com/embed/%s"
     "?autoplay=1&modestbranding=1&rel=0&playsinline=1"),
    (re.compile(r"^https?://(?:www\.)?arte\.tv/(\w\w)/videos/([\w-]+)/"),
     "https://www.arte.tv/embeds/%s/%s?autoplay=1"),
)

PLAY_ICON = ('<svg viewBox="0 0 80 80" aria-hidden="true" focusable="false">'
             '<circle cx="40" cy="40" r="40"/>'
             '<path d="M32 24 L58 40 L32 56 Z" class="play-tri"/></svg>')


def player_frame(src, post=None, watch=None):
    """A still with a play button. The host's player, with all of its lettering,
    only arrives once someone asks for it — and nothing is requested from a
    third party until then."""
    if post is None:
        return ('<div class="embed"><iframe src="%s" title="Video" loading="lazy" '
                'allow="autoplay; fullscreen; picture-in-picture" '
                'allowfullscreen></iframe></div>' % esc(src))
    slug = post["slug"]
    return ("""<div class="embed" data-player="%(src)s">
      <a class="embed-poster" href="%(watch)s" target="_blank" rel="noopener"
         aria-label="Play %(name)s">
        <picture>
          <source type="image/webp" srcset="%(w640)s 640w, %(w1280)s 1280w"
                  sizes="(max-width: 740px) 100vw, 800px">
          <img src="%(jpg)s" alt="" width="1280" height="720" loading="lazy" decoding="async">
        </picture>
        <span class="embed-play">%(icon)s</span>
      </a>
    </div>""" % {
        "src": esc(src),
        "watch": esc(watch or post.get("video", "")),
        "name": esc(post["title"].split(" \u2014 ")[0].lower()),
        "w640": asset("/assets/img/poster-%s-640.webp" % slug),
        "w1280": asset("/assets/img/poster-%s-1280.webp" % slug),
        "jpg": asset("/assets/img/poster-%s-1280.jpg" % slug),
        "icon": PLAY_ICON,
    })


def embed_url(href):
    """The player URL for a link to a video, or None if it is not one."""
    for pattern, template in VIDEO_HOSTS:
        m = pattern.match(href)
        if m:
            return template % m.groups()
    return None


def embed_videos(html, post=None):
    """Swap a project's opening 'find it here' link for the video itself.

    Only the first paragraph is considered, and only when it holds nothing but
    that link and its punctuation — which is the shape every one of these has.
    Links to pages that merely mention a film (france.tv, fawesome, a festival
    write-up) have no player to embed and are left alone.
    """
    m = re.match(r"\s*<p>(.*?)</p>", html, re.S)
    if not m:
        return html
    para = m.group(1)
    player = watch = None
    for href in re.findall(r'<a href="([^"]+)"', para):
        if not player:
            player, watch = embed_url(href), href
    if not player:
        return html
    # the paragraph must be just the link(s) and punctuation
    if re.sub(r"<[^>]+>|[\s.,;:]", "", para) not in ("findithere", "watchithere",
                                                     "watchither", "seeithere"):
        text = re.sub(r"<[^>]+>", "", para).strip().lower().replace(" ", "")
        if not text.startswith(("findithere", "watchithere", "watchither")):
            return html
    return player_frame(player, post, watch) + html[m.end():]


def project_body(post):
    """The body with its video in place: either the opening link turned into a
    player, or one named by a "video" key for a project whose text never
    linked to it."""
    html = embed_videos(post["body"], post)
    if 'class="embed"' not in html and post.get("video"):
        src = embed_url(post["video"])
        if src:
            html = player_frame(src, post, post["video"]) + html
    return html


# --- what is coming, on the front page --------------------------------------
# A short list above the work, taken from the upcoming page so an event is
# written once. Only the two months below, and only what has not happened yet —
# the page's own P A S T divider says where that stops.
UPCOMING_FROM = (2026, 9)     # the first month shown
UPCOMING_MONTHS = 3           # september, then october and november

MONTH_NAMES = ("january", "february", "march", "april", "may", "june", "july",
               "august", "september", "october", "november", "december")

# 2026_September 11_ — the shape every entry on the upcoming page is written in.
EVENT_DATE = re.compile(r"(\d{4})_([A-Z][a-z]{2,8})\.?\s(\d{1,2})_")

# Entries kept on the upcoming page but left off the front page's short list.
HOME_SKIP = re.compile(r"caidp\.org|uni-r\.org", re.I)


def text_ranges(html):
    """Where the words are, so a pattern never matches inside a tag."""
    out, i = [], 0
    for m in re.finditer(r"<[^>]*>", html):
        if m.start() > i:
            out.append((i, m.start()))
        i = m.end()
    if i < len(html):
        out.append((i, len(html)))
    return out


def date_markers(html):
    """Every date on the upcoming page, in the order it is written."""
    spans = text_ranges(html)
    return [m for m in EVENT_DATE.finditer(html)
            if any(a <= m.start() < b for a, b in spans)]


def upcoming_months(body):
    """[(month, [(day, html)])] for the months the front page shows."""
    window, y, m = [], *UPCOMING_FROM
    for _ in range(UPCOMING_MONTHS):
        window.append((y, m))
        m = 1 if m == 12 else m + 1
        y = y + 1 if m == 1 else y

    # A line runs to the next date — except the last one before the page's own
    # divider, which would otherwise swallow it.
    divider = body.find("P A S T")
    found, hits = {}, date_markers(body)
    for i, mark in enumerate(hits):
        mo = next((k for k, name in enumerate(MONTH_NAMES, 1)
                   if name.startswith(mark.group(2).lower()[:3])), None)
        key = (int(mark.group(1)), mo)
        if mo is None or key not in window:
            continue
        d = int(mark.group(3))
        if (key, d) in found:         # the first line for a day wins
            continue
        end = hits[i + 1].start() if i + 1 < len(hits) else len(body)
        if mark.end() < divider < end:
            end = divider
        line = tidy_entry(body[mark.end():end])
        if line and not HOME_SKIP.search(line):
            found[(key, d)] = line

    out = []
    for key in window:
        days = sorted(d for (k, d) in found if k == key)
        if days:
            out.append((key[1], [(d, found[(key, d)]) for d in days]))
    return out


def upcoming_block(pages):
    """The upcoming rubric that opens the front page.

    The listing she sent, at this site's scale and in its colours: the day in
    a block of accent and her own sentence beside it, links and all — the words
    that are clickable on the upcoming page are clickable here too. The row is
    not itself a link; it lights up as the cursor crosses it. The first month
    stands alone, the rest share the second column, with the way through to the
    page under the last of them.
    """
    months = upcoming_months(pages["upcoming"]["body"])
    if not months:
        return ""

    def month_html(month, rows):
        return ('        <h3 class="up-name">%s</h3>\n%s' % (
            MONTH_NAMES[month - 1],
            "\n".join(
                '        <div class="up-row">'
                '<span class="up-num">%02d</span>'
                '<span class="up-text">%s</span></div>'
                % (d, line)
                for d, line in rows)))

    columns = [c for c in ([months[0]], months[1:]) if c]
    more = ('        <p class="up-more">'
            '<a href="/upcoming/">more upcoming</a></p>')

    cols = []
    for i, col in enumerate(columns):
        parts = [month_html(mo, rows) for mo, rows in col]
        # the way through sits under the last month it lists, on the right
        if i == len(columns) - 1:
            parts.append(more)
        cols.append('      <div class="up-col">\n%s\n      </div>'
                    % "\n".join(parts))

    return ('  <section class="up" aria-labelledby="up-title">\n'
            '    <h2 class="sec-title" id="up-title">'
            '<span class="mark">upcoming</span></h2>\n'
            '    <div class="up-cols">\n%s\n    </div>\n'
            '  </section>' % "\n".join(cols))


def mark_dates(html):
    """Set every date on the page in the accent, and leave the rest black."""
    spans = text_ranges(html)
    out, last = [], 0
    for m in EVENT_DATE.finditer(html):
        if not any(a <= m.start() < b for a, b in spans):
            continue
        out.append(html[last:m.start()])
        out.append('<span class="ev-date">%s</span>' % m.group(0))
        last = m.end()
    out.append(html[last:])
    return "".join(out)


def strip_inline_styles(html):
    """Tumblr left style attributes behind — one of them sets Helvetica on a
    heading, others set colours. They override the stylesheet, so they go."""
    return re.sub(r'\s*style="[^"]*"', "", html)


def blank_external(html):
    """Every link off the site opens in a new tab."""
    def fix(m):
        attrs = m.group(1)
        if "target=" not in attrs:
            attrs += ' target="_blank"'
        if "rel=" not in attrs:
            attrs += ' rel="noopener"'
        return "<a %s>" % attrs.strip()
    return re.sub(r'<a ([^>]*href="https?://[^"]*"[^>]*)>', fix, html)


def icons(extra_class=""):
    lis = []
    for href, label, path in SOCIAL:
        rel = ' target="_blank" rel="noopener"' if href.startswith("http") else ""
        lis.append(
            '<li><a href="%s"%s aria-label="%s">'
            '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
            '<path d="%s"/></svg></a></li>' % (href, rel, label, path)
        )
    return ('<nav class="social%s" aria-label="Elsewhere"><ul>%s</ul></nav>'
            % (extra_class, "".join(lis)))


def nav_list(active):
    lis = []
    for href, label in NAV:
        cur = ' aria-current="page"' if href == active else ""
        lis.append('<li><a class="nav-link" href="%s"%s>%s</a></li>' % (href, cur, esc(label)))
    return '<nav class="navigation" aria-label="Main"><ul>%s</ul></nav>' % "".join(lis)


def header(active):
    return """<header id="header">
  <div class="wrap">
    <div class="logo"><a href="/" aria-label="%(title)s &mdash; home"><span class="logo-text">%(title)s</span></a></div>
    <script src="%(name_js)s"></script>
    %(nav)s
    %(social)s
    %(quote)s
    <button class="nav-toggle" type="button" aria-label="Menu" aria-expanded="false" aria-controls="drawer">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>
<aside id="drawer" aria-hidden="true">
  %(nav)s
  %(social)s
  %(quote)s
</aside>""" % {
        "title": TITLE,
        "quote": QUOTE,
        "nav": nav_list(active), "social": icons(),
        "name_js": asset("/assets/js/name.js"),
    }


def document(*, title, description, canonical, body, active, og_image=None,
             jsonld=False, body_class="", extra_ld=None):
    head = [
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        "<title>%s</title>" % esc(title),
        '<meta name="author" content="%s">' % esc(TITLE),
        '<meta name="robots" content="index, follow, max-image-preview:large, '
        'max-snippet:-1">',
        '<meta property="og:locale" content="en_GB">',
        '<meta name="description" content="%s">' % esc(description),
        '<link rel="canonical" href="%s%s">' % (SITE, canonical),
        '<meta property="og:type" content="website">',
        '<meta property="og:site_name" content="%s">' % esc(TITLE),
        '<meta property="og:title" content="%s">' % esc(title),
        '<meta property="og:description" content="%s">' % esc(description),
        '<meta property="og:url" content="%s%s">' % (SITE, canonical),
        '<meta name="twitter:card" content="summary_large_image">',
        '<meta name="twitter:title" content="%s">' % esc(title),
        '<meta name="twitter:description" content="%s">' % esc(description),
        '<link rel="icon" href="%s" type="image/svg+xml">' % asset("/assets/favicon.svg"),
        '<link rel="alternate icon" href="%s">' % asset("/assets/favicon.png"),
        '<link rel="apple-touch-icon" href="%s">' % asset("/assets/apple-touch-icon.png"),
        '<link rel="alternate" type="application/rss+xml" title="%s" href="/feed.xml">' % esc(TITLE),
        '<link rel="stylesheet" href="%s">' % asset("/assets/css/site.css"),
    ]
    # A text page shares the one photograph, the front page the mark, and a
    # project its own still — the picture that stands for it on the grid.
    path, w, h = og_image or SOCIAL_IMAGE
    head.append('<meta property="og:image" content="%s%s">' % (SITE, path))
    if w and h:
        head.append('<meta property="og:image:width" content="%d">' % w)
        head.append('<meta property="og:image:height" content="%d">' % h)
    head.append('<meta name="twitter:image" content="%s%s">' % (SITE, path))
    if jsonld:
        head.append('<script type="application/ld+json">%s</script>'
                    % json.dumps(JSONLD, ensure_ascii=False))
    if extra_ld:
        head.append('<script type="application/ld+json">%s</script>'
                    % json.dumps(extra_ld, ensure_ascii=False))

    return """<!DOCTYPE html>
<html lang="en">
<head>
%(head)s
</head>
<body%(cls)s>
<div class="loadbar" aria-hidden="true"></div>
%(header)s
<main id="main">
  <div class="wrap">
%(body)s
  </div>
</main>
<script src="%(site_js)s" defer></script>
</body>
</html>
""" % {
        "head": "\n".join("  " + h for h in head),
        "cls": (' class="%s"' % body_class) if body_class else "",
        "header": header(active),
        "body": body,
        "site_js": asset("/assets/js/site.js"),
    }


_ASSET_HASH = {}


def asset(path):
    """A URL that changes whenever the file behind it does.

    GitHub Pages serves everything with Cache-Control: max-age=600 and gives no
    way to change that, so a browser can hold a stylesheet for ten minutes after
    a deploy. Stamping the file's own content hash into the URL means new HTML
    can never ask for an old stylesheet: the moment the file changes, so does
    the address, and the browser has to fetch it.
    """
    if path not in _ASSET_HASH:
        with open(os.path.join(ROOT, path.lstrip("/")), "rb") as fh:
            _ASSET_HASH[path] = hashlib.sha256(fh.read()).hexdigest()[:10]
    return "%s?v=%s" % (path, _ASSET_HASH[path])


def srcset(post, ext):
    return ", ".join("%s %dw" % (asset("/assets/img/%s-%d.%s" % (post["slug"], w, ext)), w)
                     for w in post["sizes"])


def tile(post):
    """A grid tile. A plain link — project pages open like any other page."""
    alt = "%s — %s" % (post["title"], post["subtitle"]) if post["subtitle"] else post["title"]
    return """    <a class="tile" href="/work/%(slug)s/" aria-label="%(aria)s">
      <picture>
        <source type="image/webp" srcset="%(webp)s" sizes="(max-width: 740px) 31vw, 26vw">
        <img src="%(jpg)s" alt="%(alt)s" width="%(w)d" height="%(h)d" loading="lazy" decoding="async">
      </picture>
    </a>""" % {
        "slug": post["slug"],
        "webp": srcset(post, "webp"),
        "alt": esc(alt),
        "aria": esc("%s, %s" % (post["title"], post["subtitle"]) if post["subtitle"]
                    else post["title"]),
        "jpg": asset("/assets/img/%s-960.jpg" % post["slug"]),
        "w": post["w"], "h": post["h"],
    }


def build():
    posts = json.load(open(os.path.join(ROOT, "content/posts.json"), encoding="utf-8"))
    pages = json.load(open(os.path.join(ROOT, "content/pages.json"), encoding="utf-8"))

    # --- the name question ---------------------------------------------------
    # The header carries her name on the home page. Open anything else and it
    # slips into one of the questions people actually ask about that name; the
    # link still goes home, where the name is itself again.
    questions = json.load(open(os.path.join(ROOT, "content/questions.json"),
                               encoding="utf-8"))
    write("assets/js/name.js", """/* Generated by build.py from content/questions.json — do not edit. */
(function () {
    'use strict';
    var QUESTIONS = %(questions)s;

    var el = document.querySelector('.logo-text');
    if (!el) return;

    // The home page is where the name stays put.
    if (document.body && document.body.classList.contains('index-page')) return;

    var q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    el.textContent = q;
    el.parentNode.parentNode.classList.add('is-question');
}());
""" % {"questions": json.dumps(questions, ensure_ascii=False, indent=8)})

    # --- index ---------------------------------------------------------------
    grid = ('  <div class="grid-wrap">\n    <div class="grid">\n%s\n    </div>\n  </div>'
            % "\n".join(tile(p) for p in posts))
    projects = ('  <h2 class="sec-title">'
                '<span class="mark">projects</span></h2>')
    write("index.html", document(
        title=tab_title(),
        description=SEO["/"],
        canonical="/",
        og_image=HOME_SOCIAL_IMAGE,
        body="\n".join([upcoming_block(pages), projects, grid]),
        active="/",
        jsonld=True,
        body_class="index-page",
    ))

    # --- text pages ----------------------------------------------------------
    for href, label in PAGES:
        key = href.strip("/")
        page = pages[key]
        write("%s/index.html" % key, document(
            title=tab_title(page["title"]),
            description=SEO[href],
            canonical=href,
            body='  <article class="page">\n    <h1>%s</h1>\n    <div class="page-body">%s</div>\n  </article>'
                 % (esc(page["title"]),
                    page_body(href, page["body"])),
            active=href,
            body_class="text-page",
        ))

    # --- project permalinks --------------------------------------------------
    for p in posts:
        body = """  <article class="project">
    <div class="project-text">
      <h1>%(title)s</h1>
      %(subtitle)s
      %(body)s
    </div>
  </article>""" % {
            "title": esc(p["title"]),
            "subtitle": ('<p class="subtitle">%s</p>' % esc(p["subtitle"])) if p["subtitle"] else "",
            "body": strip_inline_styles(project_body(p)),
        }
        work_ld = {
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            "name": p["title"].split("\u2014")[0].strip().lower(),
            "url": "%s/work/%s/" % (SITE, p["slug"]),
            "image": "%s/assets/img/%s-960.jpg" % (SITE, p["slug"]),
            "creator": {"@type": "Person", "name": TITLE, "url": SITE},
            "description": work_seo(p),
        }
        if p["subtitle"]:
            work_ld["genre"] = p["subtitle"]
        write("work/%s/index.html" % p["slug"], document(
            title=tab_title(p["title"]),
            description=work_seo(p),
            canonical="/work/%s/" % p["slug"],
            body=body,
            active="/",
            og_image=("/assets/img/%s-960.jpg" % p["slug"], None, None),
            body_class="text-page",
            extra_ld=work_ld,
        ))

    # --- legacy Tumblr permalinks -------------------------------------------
    # /post/<id>/<slug> was the shape of every old link; keep them alive.
    # The meta-refresh and the script target are not plain link attributes, so
    # they are written relative here rather than by the rewriter.
    def stub(post, depth):
        rel = "../" * depth + "work/%s/" % post["slug"]
        return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0; url=%(rel)s">
  <link rel="canonical" href="%(site)s/work/%(slug)s/">
  <title>%(title)s</title>
  <meta name="robots" content="noindex">
</head>
<body><p>Moved to <a href="%(rel)s">%(title)s</a>.</p>
<script>location.replace("%(rel)s");</script>
</body>
</html>
""" % {"rel": rel, "site": SITE, "slug": post["slug"], "title": esc(post["title"])}

    for p in posts:
        write("post/%s/%s/index.html" % (p["id"], p["slug"]), stub(p, 3))
        write("post/%s/index.html" % p["id"], stub(p, 2))

    # --- 404 -----------------------------------------------------------------
    # GitHub Pages serves this for any unknown path while the address bar keeps
    # the path that was asked for, so relative URLs would resolve from the wrong
    # place. It is therefore standalone: styles inline, home link worked out at
    # runtime so it is right on the domain root and on a project subpath alike.
    write("404.html", r"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>not found %(sep)s %(title)s</title>
  <meta name="robots" content="noindex">
  <style>
    body { margin: 0; font: 400 13px/1.4 "Helvetica Neue", Helvetica, Arial, sans-serif;
           color: #000; background: #fff; }
    main { padding: 70px 25px 70px 50px; max-width: 800px; }
    h1 { font-size: 30px; font-weight: 700; line-height: 1; margin: 0 0 20px;
         text-transform: lowercase; }
    a { color: #000; font-weight: 700; text-decoration: none;
        transition: color .25s linear; }
    a:hover { color: #ff6f26; }
  </style>
</head>
<body>
  <main>
    <h1>not found</h1>
    <p>That page has moved or never existed.
       <a id="home" href="/">Back to the work</a>.</p>
  </main>
  <script>
    // On user.github.io/repo/ the site root is the first path segment.
    var seg = location.pathname.split("/")[1];
    document.getElementById("home").href =
      /\.github\.io$/.test(location.hostname) && seg ? "/" + seg + "/" : "/";
  </script>
</body>
</html>
""" % {"title": esc(TITLE.lower()), "sep": SEP})

    # --- sitemap & feed ------------------------------------------------------
    urls = ["/"] + [h for h, _ in PAGES] + ["/work/%s/" % p["slug"] for p in posts]
    write("sitemap.xml",
          '<?xml version="1.0" encoding="UTF-8"?>\n'
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
          + "".join("  <url><loc>%s%s</loc></url>\n" % (SITE, u) for u in urls)
          + "</urlset>\n")

    items = "".join(
        "    <item>\n"
        "      <title>%s</title>\n"
        "      <link>%s/work/%s/</link>\n"
        "      <guid>%s/work/%s/</guid>\n"
        "      <description>%s</description>\n"
        "    </item>\n" % (
            esc(p["title"]), SITE, p["slug"], SITE, p["slug"],
            esc(work_seo(p)))
        for p in posts)
    write("feed.xml",
          '<?xml version="1.0" encoding="UTF-8"?>\n'
          '<rss version="2.0"><channel>\n'
          "    <title>%s</title>\n    <link>%s/</link>\n    <description>%s</description>\n%s"
          "</channel></rss>\n" % (esc(TITLE), SITE, esc(TAGLINE), items))

    write("robots.txt", "User-agent: *\nAllow: /\nSitemap: %s/sitemap.xml\n" % SITE)
    open(os.path.join(ROOT, ".nojekyll"), "w").close()

    print("built %d projects, %d pages" % (len(posts), len(PAGES)))


# Every internal path is authored root-absolute, then rewritten relative to the
# page that carries it. That way one build serves correctly from the domain root
# (www.ronyefrat.work) and from a GitHub Pages project subpath
# (user.github.io/repo/) without rebuilding.

_ATTR = re.compile(r'\b(href|src|data-full|action)="/(?!/)([^"]*)"')
_SET = re.compile(r'\b(srcset|data-fullset)="([^"]*)"')


def relativize(html, depth):
    prefix = "../" * depth if depth else "./"

    def attr(m):
        return '%s="%s%s"' % (m.group(1), prefix, m.group(2))

    def srcset(m):
        parts = []
        for entry in m.group(2).split(","):
            entry = entry.strip()
            if entry.startswith("/") and not entry.startswith("//"):
                entry = prefix + entry[1:]
            parts.append(entry)
        return '%s="%s"' % (m.group(1), ", ".join(parts))

    return _SET.sub(srcset, _ATTR.sub(attr, html))


def write(path, content):
    if path.endswith(".html"):
        content = blank_external(content)
        content = relativize(content, path.count("/"))
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full) or ROOT, exist_ok=True)
    with open(full, "w", encoding="utf-8") as fh:
        fh.write(content)


if __name__ == "__main__":
    build()
