#!/usr/bin/env python3
"""Build ronyefrat.work into static HTML for GitHub Pages.

    python3 build.py

Content lives in content/posts.json and content/pages.json; everything the
browser needs ends up in the repo root and assets/. There is no other
toolchain — the output is plain HTML you can also edit by hand.
"""

import json
import os
import re
import shutil

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = "https://www.ronyefrat.work"
TITLE = "Rony Efrat"
TAGLINE = "technology is the campfire around which we tell our stories."

NAV = [
    ("/upcoming/", "upcoming"),
    ("/about/", "about"),
    ("/filmography/", "Filmography"),
    ("/academia/", "Academia"),
    ("/ai/", "AI"),
    ("/press/", "Press"),
]

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
    "jobTitle": "Filmmaker, Writer, Researcher",
    "description": ("Multilingual writer, filmmaker, and researcher based in Paris. "
                    "Her work explores how language and technology create an uncanny "
                    "sense of place."),
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


def strip_tags(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s)).strip()


def short(title, limit=38):
    """Trim a neighbour's title so the prev/next line stays on one row."""
    return title if len(title) <= limit else title[:limit].rstrip(" —,-") + "\u2026"


def lazy_iframes(html):
    """Defer third-party embeds until they are scrolled to."""
    return re.sub(r"<iframe(?![^>]*loading=)", '<iframe loading="lazy"', html)


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
        lis.append('<li><a class="nav-link" href="%s"%s>%s</a></li>' % (href, cur, label))
    return '<nav class="navigation" aria-label="Main"><ul>%s</ul></nav>' % "".join(lis)


def header(active):
    return """<header id="header">
  <div class="wrap">
    <div class="logo"><a href="/" aria-label="%(title)s &mdash; home"><span class="logo-text">%(title)s</span></a></div>
    <script src="/assets/js/name.js"></script>
    %(nav)s
    %(social)s
    <div class="header-description"><p>%(tagline)s</p></div>
    <button class="nav-toggle" type="button" aria-label="Menu" aria-expanded="false" aria-controls="drawer">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>
<aside id="drawer" aria-hidden="true">
  %(nav)s
  %(social)s
  <div class="header-description"><p>%(tagline)s</p></div>
</aside>""" % {
        "title": TITLE, "tagline": TAGLINE,
        "nav": nav_list(active), "social": icons(),
    }


def document(*, title, description, canonical, body, active, og_image=None, jsonld=False,
             body_class=""):
    head = [
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        "<title>%s</title>" % esc(title),
        '<meta name="description" content="%s">' % esc(description),
        '<link rel="canonical" href="%s%s">' % (SITE, canonical),
        '<meta property="og:type" content="website">',
        '<meta property="og:site_name" content="%s">' % esc(TITLE),
        '<meta property="og:title" content="%s">' % esc(title),
        '<meta property="og:description" content="%s">' % esc(description),
        '<meta property="og:url" content="%s%s">' % (SITE, canonical),
        '<meta name="twitter:card" content="summary_large_image">',
        '<link rel="icon" href="/assets/favicon.png">',
        '<link rel="alternate" type="application/rss+xml" title="%s" href="/feed.xml">' % esc(TITLE),
        '<link rel="stylesheet" href="/assets/css/site.css">',
    ]
    if og_image:
        head.append('<meta property="og:image" content="%s%s">' % (SITE, og_image))
    if jsonld:
        head.append('<script type="application/ld+json">%s</script>'
                    % json.dumps(JSONLD, ensure_ascii=False))

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
<script src="/assets/js/site.js" defer></script>
</body>
</html>
""" % {
        "head": "\n".join("  " + h for h in head),
        "cls": (' class="%s"' % body_class) if body_class else "",
        "header": header(active),
        "body": body,
    }


def srcset(post, ext):
    return ", ".join("/assets/img/%s-%d.%s %dw" % (post["slug"], w, ext, w)
                     for w in post["sizes"])


def tile(post):
    """A grid tile. A plain link — project pages open like any other page."""
    alt = "%s — %s" % (post["title"], post["subtitle"]) if post["subtitle"] else post["title"]
    return """    <a class="tile" href="/work/%(slug)s/" aria-label="%(aria)s">
      <picture>
        <source type="image/webp" srcset="%(webp)s" sizes="(max-width: 740px) 31vw, 26vw">
        <img src="/assets/img/%(slug)s-960.jpg" alt="%(alt)s" width="%(w)d" height="%(h)d" loading="lazy" decoding="async">
      </picture>
    </a>""" % {
        "slug": post["slug"],
        "webp": srcset(post, "webp"),
        "alt": esc(alt),
        "aria": esc("%s, %s" % (post["title"], post["subtitle"]) if post["subtitle"]
                    else post["title"]),
        "w": post["w"], "h": post["h"],
    }


def build():
    posts = json.load(open(os.path.join(ROOT, "content/posts.json"), encoding="utf-8"))
    pages = json.load(open(os.path.join(ROOT, "content/pages.json"), encoding="utf-8"))

    # --- index ---------------------------------------------------------------
    grid = ('  <div class="grid-wrap">\n    <div class="grid">\n%s\n    </div>\n  </div>'
            % "\n".join(tile(p) for p in posts))
    write("index.html", document(
        title=TITLE,
        description=TAGLINE,
        canonical="/",
        body=grid,
        active="/",
        og_image="/assets/img/%s-960.jpg" % posts[0]["slug"],
        jsonld=True,
        body_class="index-page",
    ))

    # --- text pages ----------------------------------------------------------
    for href, label in NAV:
        key = href.strip("/")
        page = pages[key]
        write("%s/index.html" % key, document(
            title="%s — %s" % (page["title"], TITLE),
            description=strip_tags(page["body"])[:180],
            canonical=href,
            body='  <article class="page">\n    <h1>%s</h1>\n    <div class="page-body">%s</div>\n  </article>'
                 % (esc(page["title"]), lazy_iframes(page["body"])),
            active=href,
            body_class="text-page",
        ))

    # --- project permalinks --------------------------------------------------
    for i, p in enumerate(posts):
        prev_p = posts[i - 1] if i else None
        next_p = posts[i + 1] if i + 1 < len(posts) else None
        nav = []
        if prev_p:
            nav.append('<a class="back" href="/work/%s/">&larr; %s</a>'
                       % (prev_p["slug"], esc(short(prev_p["title"]))))
        if next_p:
            nav.append('<a class="back" href="/work/%s/">%s &rarr;</a>'
                       % (next_p["slug"], esc(short(next_p["title"]))))
        body = """  <article class="project">
    <div class="project-media">
      <picture>
        <source type="image/webp" srcset="%(webp)s" sizes="(max-width: 740px) 100vw, 62vw">
        <img src="/assets/img/%(slug)s-960.jpg" alt="%(alt)s" width="%(w)d" height="%(h)d" decoding="async">
      </picture>
    </div>
    <div class="project-text">
      <h1>%(title)s</h1>
      %(subtitle)s
      %(body)s
      <p><a class="back" href="/">&larr; All work</a></p>
      <p>%(nav)s</p>
    </div>
  </article>""" % {
            "webp": srcset(p, "webp"),
            "slug": p["slug"],
            "alt": esc(p["title"]),
            "w": p["w"], "h": p["h"],
            "title": esc(p["title"]),
            "subtitle": ('<p class="subtitle">%s</p>' % esc(p["subtitle"])) if p["subtitle"] else "",
            "body": p["body"],
            "nav": " &nbsp;&nbsp; ".join(nav),
        }
        write("work/%s/index.html" % p["slug"], document(
            title="%s — %s" % (p["title"], TITLE),
            description=(p["subtitle"] + ". " if p["subtitle"] else "") + strip_tags(p["body"])[:170],
            canonical="/work/%s/" % p["slug"],
            body=body,
            active="/",
            og_image="/assets/img/%s-960.jpg" % p["slug"],
            body_class="text-page",
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
  <title>Not found &mdash; %(title)s</title>
  <meta name="robots" content="noindex">
  <style>
    body { margin: 0; font: 400 13px/1.4 "Helvetica Neue", Helvetica, Arial, sans-serif;
           color: #000; background: #fff; }
    main { padding: 70px 25px 70px 50px; max-width: 800px; }
    h1 { font-size: 30px; font-weight: 700; line-height: 1; margin: 0 0 20px;
         text-transform: lowercase; }
    a { color: #000; font-weight: 700; transition: color .25s linear; }
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
""" % {"title": esc(TITLE)})

    # --- sitemap & feed ------------------------------------------------------
    urls = ["/"] + [h for h, _ in NAV] + ["/work/%s/" % p["slug"] for p in posts]
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
            esc(strip_tags(p["body"])[:300]))
        for p in posts)
    write("feed.xml",
          '<?xml version="1.0" encoding="UTF-8"?>\n'
          '<rss version="2.0"><channel>\n'
          "    <title>%s</title>\n    <link>%s/</link>\n    <description>%s</description>\n%s"
          "</channel></rss>\n" % (esc(TITLE), SITE, esc(TAGLINE), items))

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

    write("robots.txt", "User-agent: *\nAllow: /\nSitemap: %s/sitemap.xml\n" % SITE)
    open(os.path.join(ROOT, ".nojekyll"), "w").close()

    print("built %d projects, %d pages" % (len(posts), len(NAV)))


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
        content = relativize(content, path.count("/"))
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full) or ROOT, exist_ok=True)
    with open(full, "w", encoding="utf-8") as fh:
        fh.write(content)


if __name__ == "__main__":
    build()
