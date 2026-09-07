# ronyefrat.work

The site, recoded from the Tumblr build and hosted on GitHub Pages. Plain HTML,
CSS and JavaScript — no framework, no bundler, no dependencies.

## What's here

```
index.html              the work grid
about/ academia/ ai/    the text pages
filmography/ press/
upcoming/
work/<slug>/            one page per project (18)
post/<id>/<slug>/       redirects for the old Tumblr permalinks
assets/css/site.css     all styling
assets/js/site.js       grid reveal, mobile drawer
assets/js/name.js       generated from content/questions.json
assets/img/             every image, as WebP (480/960/1600) + a JPEG fallback,
                        and mark-card.png, the card a shared link opens with
assets/fonts/           Inconsolata, self-hosted (two variable subsets)
content/posts.json      the 18 projects: title, subtitle, date, body HTML,
                        and an optional "video" to embed
content/pages.json      the six text pages
content/questions.json  the questions the header asks about her name
build.py                regenerates the HTML from content/
tools/make-icons.py     redraws the mark: favicons and the social card
```

## The mark

◩, in the accent, drawn from a single set of proportions in
`tools/make-icons.py`: the favicon, the icon a phone keeps on its home screen,
and `mark-card.png`, the 1200×630 card a shared link to the front page opens
with. That script needs Pillow, which `build.py` deliberately does not — the
build stays stdlib-only, so the icons are drawn once and committed. Run it if
the accent changes, or the mark does.

Every other page shares one photograph, *Tra il dire e il fare*, except a
project, which previews with its own still. The front page is the site rather
than any one piece, so it carries the mark instead.

## Editing

**Text and links** live in `content/posts.json` and `content/pages.json`.
Edit those, then:

```sh
python3 build.py
```

That rewrites every HTML file. Python 3 is the only requirement — no packages.

**A new project**: add an entry to `content/posts.json` (copy the shape of an
existing one), drop the image into `assets/img/` as
`<slug>-480.webp`, `<slug>-960.webp`, `<slug>-1600.webp` and `<slug>-960.jpg`,
then run `build.py`. Order in the file is the order on the page.

You can also just edit the generated HTML directly — but `build.py` will
overwrite it next time it runs, so put lasting changes in `content/`.

## Preview locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Caching

GitHub Pages serves every file with `Cache-Control: max-age=600` and offers no
way to change that, so a browser can hold on to a stylesheet for ten minutes
after a deploy. To stop that ever pairing new HTML with an old stylesheet,
`build.py` stamps each asset's own content hash into its URL:

```html
<link rel="stylesheet" href="/assets/css/site.css?v=fc5d2d33c4">
```

Change the file and the address changes with it, so the browser has to fetch
it. Leave it alone and the address stays put, so it stays cached. The hash is
of the file's bytes, so the same content always gives the same URL. CSS,
JavaScript, the favicon and every image are covered.

What this does *not* change is the ten minutes on the HTML itself: a reader who
loaded a page nine minutes before a deploy keeps seeing that page, whole and
consistent, until it lapses. There is no mixed state, and no hard reload is
needed — it corrects itself.

The fonts are the one exception, deliberately: their names never change because
their contents never do. If you ever swap a font file, give it a new filename.

## Deploying

Pushes to `main` are built and published by
[`.github/workflows/pages.yml`](.github/workflows/pages.yml).

To turn it on the first time: **Settings → Pages → Build and deployment →
Source: GitHub Actions**. The site then goes live at
`https://<user>.github.io/<repo>/`.

### The preview site

The Pages URL, `https://<user>.github.io/<repo>/`, is the preview. It is not the
public site — that stays on Tumblr until the DNS change below — so `main` can be
used freely to look at work in progress.

Every internal path is relative, so the preview behaves exactly like the
finished site: styles, images, navigation, the project pages, the old-permalink
redirects. Nothing needs rebuilding when the custom domain is switched on later.

Only `canonical` and `og:` tags differ, pointing at `www.ronyefrat.work` since
that is where the site is headed. Harmless while previewing, correct once live.

**Previewing a branch without merging** takes one setting. By default the
`github-pages` environment only accepts deployments from the default branch, so
running the workflow on a branch builds fine and then fails at the deploy step
with no logs. To allow it: **Settings → Environments → `github-pages` →
Deployment branches**, and add a pattern such as `claude/*`. After that,
Actions → **Deploy to GitHub Pages** → **Run workflow** → pick the branch
publishes it to the same Pages URL.

Without that setting, seeing a branch means merging it to `main` first.

### Pointing www.ronyefrat.work at it

Do this only once the Pages build looks right, because it takes the domain away
from Tumblr.

1. At your DNS host, replace the Tumblr record for `www` with a CNAME to
   `<user>.github.io`.
2. In **Settings → Pages → Custom domain**, enter `www.ronyefrat.work` and save.
   GitHub writes a `CNAME` file to the repo.
3. Tick **Enforce HTTPS** once the certificate is issued (usually minutes).

Until step 2, no `CNAME` file should exist in the repo — one would redirect the
`github.io` preview URL to a domain that still resolves to Tumblr.

## Upcoming, on the front page

Under `upcoming`, three months as a small listing: the day set in a block of
green with black numerals, and her own sentence beside it — the same line the
upcoming page carries, her capitals and her links and all. The words that are
clickable there are clickable here. The row is not itself a link; it lights up
as the cursor crosses it, and a hovered word turns the row's colours inside
out. The line reads at one weight — bold was falling on whichever words
happened to carry a link, which looks like emphasis she never wrote, so a link
is signalled by the cursor rather than by weight.

The first month stands in the left column, the rest share the right one,
with the way through to the page under the last of them. Then `projects`, and
the grid.

```python
UPCOMING_FROM = (2026, 9)     # the first month shown
UPCOMING_MONTHS = 3           # september, then october and november
```

Nothing else to keep in step: an event is written once in `content/pages.json`,
links included, and appears in both places.

On a phone the two columns become one and the months follow each other; every
row keeps its number to the left rather than stacking.

The months take every date they find, whether or not it has happened —
September 7 is listed, and it has. To show only what is still ahead, drop the
dates that fall before today in `upcoming_months`.

## The upcoming page

Every date in one run, newest at the top, oldest at the foot. It was written in
two halves — what was coming, and then `P A S T` counting back — and `build.py`
now drops that divider, sorts every entry by date, and gives each one its own
paragraph, which also tidies away the line breaks the old build left between
them. Nothing is lost: all 35 entries, all 37 links.

It is not in the menu. The front page opens on what is coming and carries
`more upcoming` through to the rest, so a second way in from the sidebar only
said the same thing twice. The page is still built, still in the sitemap and
the feed, and still at `/upcoming/`. `PAGES` in `build.py` is every text page;
`NAV` is the menu, which is `PAGES` minus that one.

## The name in the header

On the home page the header says **Rony Efrat**, in green. Open any other page
and it becomes one of the questions in `content/questions.json`, picked afresh
on every load. The link still goes home, and there the name is itself again.

To add or change a question, edit `content/questions.json` and run `build.py` —
it regenerates `assets/js/name.js`. Two lines are reserved for it in the sidebar
so the navigation below does not move from one question to the next; on mobile
it is clamped to fit the bar. The link keeps `aria-label="Rony Efrat — home"`,
and the page title, `og:` tags and structured data all carry the real name, so
screen readers and search engines are unaffected. With JavaScript off, the
header simply reads Rony Efrat everywhere.

## Type

Everything is set in Consolas, with Inconsolata — drawn as a free counterpart
to Consolas — self-hosted for the machines that do not have it, so the page
reads the same everywhere and makes no third-party requests. One variable file
per subset (latin, latin-ext) covers regular through bold, about 65KB in all.

The `@font-face` URLs are relative to the stylesheet rather than the site root:
CSS resolves `url()` against the stylesheet, so the fonts load at the domain
root and at a Pages subpath alike. The HTML path rewriter never sees inside
CSS.

On the upcoming page the date that opens each line — `2026_September 11_` — is
in the accent and everything after it is black. `build.py` marks them, matching
only inside the words so a pattern never lands in a tag or a URL.

Nothing on the site is underlined, anywhere. Links, including the navigation,
take the accent on hover; the current page stays in it. Page names are lower
case, and so are the project titles — those by `text-transform`, so
`content/posts.json` keeps the capitals they were written with.

## Notes on the rebuild

Layout, type and spacing are reproduced from the original: the fixed 17% left
column, the 800px text measure, the three-column grid at 31.33% with a 3%
gutter, black on white. Tile positions match the
original to the pixel at 1440px. One gutter runs in both directions — 3% of
the grid's width between the columns, the same again between the rows and under
the last of them — and the upcoming listing above the grid ends on the same
right edge.

The palette is three colours: black, white, and green screen green `#00FF33`.
One rule holds it together — **the green is a ground, never a letter.**

| | contrast |
|---|---|
| `#00FF33` text on white | 1.4:1 — fails |
| black text on `#00FF33` | **15.3:1** — passes AAA |

WCAG asks 4.5:1 for text and 3:1 for large text, and no bright green clears
that on white. So nothing is written in green. Everything that used to be —
her name, the current page in the navigation, the project titles, the section
headings, the dates on the upcoming page, a hovered link — is now marked in
it: a green band behind black type, `box-decoration-break: clone` so a phrase
that wraps takes a band per line rather than one box around the block. The
social icons are green tiles with the glyph cut out of them in black, and
hovering her name turns the band inside out, black behind green, which is the
same 15.3:1.

Green still fills where a fill is what it is: the day blocks in the upcoming
listing, a hovered row, the duotone over a tile, the play button, the typing
caret. Text on any of them is black. Outlines are black too — a green one
disappears on white — and the loading bar carries a hairline rule so a bright
green line has an edge to be seen against.

Three colours and no fourth. There is no pale green: a listing row rests on
white paper, marked by its day block, and fills only under the cursor. The
greys from the original build stay for what they always did — the placeholder
behind a loading tile, the hairline rules, the quote's attribution.

Every project opens as its own page at `/work/<slug>/`, the same way `about`
or `press` opens. Nothing overlays the grid. A project page starts at its
title: the still belongs to the grid and is not repeated underneath.

Where a project's text opened with a link to a video, the player stands in its
place. A project whose text never linked to one can name it with a `"video"`
key in `content/posts.json`. Vimeo, YouTube and ARTE are understood; a link to
a page that merely mentions a film stays a link.

Motion, and only motion, was added to the original:

- a hairline accent progress bar instead of the blocking spinner
- grid tiles rise and fade in, staggered, as they enter the viewport
- on hover a tile eases in slightly and turns into a two-colour print: the
  accent in the shadows, white in the highlights
- on mobile the top bar retracts as you scroll down and returns on scroll up,
  and the drawer's links cascade in
- everything above is disabled under `prefers-reduced-motion`

Nothing on the site links to Tumblr. The old `/post/<id>/<slug>` addresses are
kept as redirects into `/work/<slug>/` so existing inbound links still land.
