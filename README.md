# bpcti.org

Website for BP Communication Training Institute (BPCTI), served by GitHub Pages from the root of `main`.

## Editing content

All content lives in two files. Edit them, then rebuild:

- `src/content/courses.js`: the eight specializations (overview, audience, outcomes, 12-week curriculum, highlights). Each course must have exactly 12 weeks; the build fails otherwise.
- `src/content/site.js`: contact info, form and donation links, navigation, shared sections, flexible learning, cultural workshops, SEO titles.

```sh
node src/build.js
```

This regenerates every page (`index.html`, `programs/…`, `about/`, etc.), `404.html`, `sitemap.xml`, and `robots.txt`. Commit the generated files along with your edits. Node 18+ is required; there are no dependencies.

Styles are in `assets/css/site.css`; the small script for the menu and curriculum accordion is `assets/js/site.js`.

## Publication switches (`src/content/site.js`)

- `SHOW_TUITION`: `false` until the catalog, enrollment agreement, refund policy, and Washington regulatory status are reconciled. Set to `true` to show `PROPOSED_TUITION` on the Admissions & Tuition page.

## Photos for specialization cards

Cards show navy/gold typographic panels by default. To use a photo, add `assets/img/spec-english-a.jpg` (etc.) and set `image: "img/spec-english-a.jpg"` on that course in `courses.js`.

## Local preview

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```
