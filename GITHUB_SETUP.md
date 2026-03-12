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
