# Arkaiv: Surabaya Creative Directory

Map-first directory of design studios and creative agencies in Surabaya, the digital
companion to the book *Direktori Studio Desain ADGI Surabaya*. Built from the PRD
(Draft v0.2). Static site: React + Vite, MapLibre, Supabase (optional), shared hosting.

> **Sample data.** `src/data/studios.json` holds fictional studios (`"sample": true`), and the
> site shows a banner while it does. Replace them with verified records before launch.

## Run

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # snapshot -> check-data -> vite build -> prerender, output in dist/
npm run preview      # serve dist/ locally
npm run check-data   # validate studios.json against the PRD data rules
npm run lint
```

Copy `.env.example` to `.env` to connect Supabase, set the public site URL and link the
submission form. Everything works without it.

## User flow and information architecture

| Route | Destination | PRD |
|---|---|---|
| `/` | Explore: map + list + category filter + pin summary card | FR-01 to FR-06 |
| `/studio/:slug` | Studio profile inside the Explore layout; map centers on the studio. Stable URL for the book's QR codes | FR-07 to FR-09 |
| `/tentang` | About: purpose, selection criteria, how to be listed or corrected | FR-12 |
| `/daftar` (`?koreksi=<slug>`) | Submit or correct a studio via the external form | FR-13 |

The map and list are two views of one dataset and share filter state, which is kept in
the URL (`?kategori=branding,editorial`), so it survives moving between list and profile.
Desktop: side panel next to the map. Mobile (<900 px): map first, list/profile in a
bottom sheet (FR-14).

## Where things live

```
src/
  App.jsx                 routes + shell (header, nav, sample banner)
  pages/                  Explore layout, list panel, profile, About, Submit, 404
  components/             StudioMap (MapLibre), SummaryCard, CategoryFilter, Legend, BottomSheet
  state/                  DirectoryProvider: studios, filters, hover/selection
  lib/                    data loading, filters, colors, geo, analytics, hooks
  i18n/id.js              all interface strings (Indonesian; add en.js in V2)
  data/
    studios.json          published-studio snapshot (build output when Supabase is set)
    categories.json       editable category records
    areas.json            wilayah + area codes (P/U/T/S/B-SUB)
    surabaya-wilayah.geo.json   PLACEHOLDER simplified boundaries
scripts/                  snapshot.js, check-data.js, prerender.js
supabase/schema.sql       tables + row level security (apply manually)
public/.htaccess          Apache rewrites, compression, cache headers
```

## Before launch

- Replace `surabaya-wilayah.geo.json` with licensed official boundaries (PRD section 13).
- Replace the sample studios with verified records; `npm run check-data` enforces the rules.
- Replace the 12 placeholder accent colors in `src/lib/colors.js` with the deck's values.
- Swap the Phosphor stand-ins in `src/components/icons.jsx` for the deck's category icons.
- Set `VITE_SITE_URL` (canonical URLs, share tags, sitemap) and `VITE_SUBMISSION_FORM_URL`.
- Add a default share image; studios without a cover currently share without one.

## Deploy (shared hosting)

Run `npm run build` and upload the contents of `dist/` (including `.htaccess`) to the
web root. Each studio gets a prerendered `dist/studio/<slug>/index.html`.
