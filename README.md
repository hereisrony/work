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
assets/img/             every image, as WebP (480/960/1600) + a JPEG fallback
assets/fonts/           Inconsolata, self-hosted (two variable subsets)
content/posts.json      the 18 projects: title, subtitle, date, body HTML
content/pages.json      the six text pages
content/questions.json  the questions the header asks about her name
build.py                regenerates the HTML from content/
```

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

Nothing on the site is underlined, anywhere. Links, including the navigation,
take the accent on hover; the current page stays in it. Page names are lower
case, and so are the project titles — those by `text-transform`, so
`content/posts.json` keeps the capitals they were written with.

## Notes on the rebuild

Layout, type and spacing are reproduced from the original: the fixed 17% left
column, the 800px text measure, the three-column grid at 31.33% with a 3%
gutter, black on white. Tile positions match the
original to the pixel at 1440px. The one accent is green screen green
`#00CC00` — it carries the name, the social icons, the current and hovered
navigation, the project titles, the hover treatment on a tile and the loading
bar.

Every project opens as its own page at `/work/<slug>/`, the same way `about`
or `press` opens. Nothing overlays the grid.

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
