# BD 2026 Guidebook

This repository is a private, offline-first study guide for a web3 business development operator. It is written as a small book with Markdown source files and a generated static site.

## What is inside

- `chapters/`: the manuscript in Markdown
- `scripts/build.mjs`: generates the static book into `dist/`
- `scripts/serve.mjs`: serves the generated site locally
- `dist/`: the offline site and printable HTML output

## Quick start

```bash
cd "/Users/dsrv/Desktop/bd 2026 guidebook"
npm run build
open dist/index.html
```

If you want a local web server instead of opening the file directly:

```bash
cd "/Users/dsrv/Desktop/bd 2026 guidebook"
npm run serve
```

Then open `http://localhost:4173`.

## Notes

- The project uses only Node built-ins. No dependency install is required.
- `dist/print.html` is a single-page printable version of the full book.
- The content is framed around the market as of March 12, 2026.

## GitHub

See `GITHUB_SETUP.md` for the private repo workflow.
