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
assets/js/site.js       grid reveal, modal, mobile drawer
assets/img/             every image, as WebP (480/960/1600) + a JPEG fallback
content/posts.json      the 18 projects: title, subtitle, date, body HTML
content/pages.json      the six text pages
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

## Deploying

Pushes to `main` are built and published by
[`.github/workflows/pages.yml`](.github/workflows/pages.yml).

To turn it on the first time: **Settings → Pages → Build and deployment →
Source: GitHub Actions**. The site then goes live at
`https://<user>.github.io/<repo>/`.

### Previewing before you merge

Actions → **Deploy to GitHub Pages** → **Run workflow**, and pick the branch.
It publishes that branch to the same Pages URL, so you can look at the whole
site before anything touches `main`.

Every internal path is relative, so the preview at
`https://<user>.github.io/<repo>/` works exactly like the finished site — styles,
images, navigation, the project modal, the old-permalink redirects. Nothing
needs rebuilding when the custom domain is switched on later.

The one thing that differs on the preview: `canonical` and `og:` tags point at
`www.ronyefrat.work`, since that is where the site is headed. Harmless while
previewing, correct once live.

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

## Notes on the rebuild

Layout, type and spacing are reproduced from the original: the fixed 17% left
column, the 800px text measure, the three-column grid at 31.33% with a 3%
gutter, 13px/1.4 Helvetica Neue, black on white, `#ff6f26` as the one accent.
Tile positions match the original to the pixel at 1440px.

What changed is the motion, and only the motion — no copy, no images, no links
were added or removed:

- a hairline accent progress bar instead of the blocking spinner
- grid tiles rise and fade in, staggered, as they enter the viewport
- on hover a tile eases in slightly while the accent washes up from its floor
- nav links draw an accent underline from the left
- the project modal rises from the bottom over a blurred scrim; stepping
  between projects slides in the direction you're going
- on mobile the top bar retracts as you scroll down and returns on scroll up,
  and the drawer's links cascade in
- everything above is disabled under `prefers-reduced-motion`

Behaviour kept from the original: click a tile to open it over the grid, the
grid stays put behind, Escape or the scrim closes it. Added alongside: arrow
keys and swipe to move between projects, real URLs for every project so links
are shareable, and a working back button.
