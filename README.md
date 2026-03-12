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

## GitHub Pages

The repository includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml` that builds the book and deploys `dist/` to GitHub Pages on every push to `main`.

To activate it in GitHub:

1. Open the repository settings.
2. Go to `Settings -> Pages`.
3. Set the source to `GitHub Actions`.
4. Push to `main` or run the workflow manually from the `Actions` tab.

The Pages URL will appear in the workflow summary after deployment.
