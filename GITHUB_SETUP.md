# GitHub Setup

The local repository is already initialized.

## Create a private GitHub repository

If GitHub CLI is authenticated on this machine, run:

```bash
cd "/Users/dsrv/Desktop/bd 2026 guidebook"
gh auth login
git add -A
git commit -m "Initial BD 2026 guidebook"
gh repo create bd-2026-guidebook --private --source=. --remote=origin --push
```

## Suggested repository settings

- Visibility: `Private`
- Description: `Offline-first web3 BD study guide for 2026`
- Default branch: `main`

## How to use it privately

- Use the repository as the source of truth for the manuscript.
- Rebuild locally after editing: `npm run build`
- Open the generated site from `dist/index.html` or run `npm run serve`.

## About deployment

Because you asked for a private offline study guide, the simplest deployment target is your local machine. If you later want hosted private access, use one of these:

- GitHub private repo plus local build and local viewing
- Cloudflare Access or Tailscale Funnel in front of a private static host
- A private Vercel project if you want authenticated web access

GitHub Pages is not the best default here because your requirement is specifically private and offline-first.

## GitHub Actions deployment

This repository now includes `.github/workflows/deploy-pages.yml`.

It will:

- build the book with `npm run build`
- upload `dist/` as a Pages artifact
- deploy the generated site to GitHub Pages

To enable it:

1. Open the repository on GitHub.
2. Go to `Settings -> Pages`.
3. Under build and deployment, choose `GitHub Actions`.
4. Push a commit to `main`, or run the workflow manually from the `Actions` tab.

Important note:

- GitHub's private Pages access control is not the default path for a user-owned private repository. If you need strict private web access, use an authenticated private host instead of assuming Pages access will stay private.
