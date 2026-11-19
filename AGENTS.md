# Amity

React + TypeScript + Vite app for annotating ebooks with friends (mock data, no accounts yet).

## Commands
- `npm.cmd run dev` – dev server (http://localhost:5173). Use `npm.cmd` on this machine; PowerShell blocks `npm.ps1`.
- `npm.cmd run typecheck` – TypeScript check
- `npm.cmd run build` – typecheck + production build (built for the `/Amity/` base path; check it with `npx.cmd vite preview` at http://localhost:4173/Amity/)
- Deploy: pushing to `main` runs `.github/workflows/deploy.yml`, publishing to https://ashcub.github.io/Amity/. Reference files in `public/` via `asset()` from `src/asset.ts` (never hard-code `/...` paths), and use relative `url(...)` paths in `public/reader.css`.

## Layout
- `src/pages/` – Home, Friends, FriendProfile, Profile, Reader (annotation page, uses epub.js), NotFound
- `src/components/ReaderPanel.tsx` – reader drawer (table of contents + notes list)
- `src/settings.tsx` – settings context (name, text size, page color, friend-note toggle) persisted to localStorage; `SettingsModal` opens from the header gear
- `src/data.ts` – mock books, friends, activity feed, and friend comment pools
- `src/annotations.ts` – localStorage persistence (notes, replies, seen, progress) + deterministic generation of the co-reader's squiggly annotations and the cached per-book friend-note index (`getFriendIndex`; bump `INDEX_VERSION` if the generation algorithm changes)
- Reader deep links: `/read/:bookId?panel=notes|contents`, `?note=friend:<section>:<n>`, `?note=mine:<id>`
- `src/epubFixes.ts` – patches epub.js so Kobo `.html` chapters with self-closing `<script/>` tags render
- `public/books`, `public/covers`, `public/fonts`, `public/brand` – ebook files and brand assets. The only image assets allowed are the wordmark and the yellow/black spark in `public/brand`; do not add other decorative SVGs.
- `public/reader.css` – styles injected into the epub iframe (fonts, squiggle underline)

## Notes
- Body font (Hank Round) lacks curly quotes/ellipsis glyphs; use ASCII `'` and `...` in UI strings.
