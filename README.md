# Prompt Academy

Prompt Academy is a Duolingo-style interactive learning app for AI image prompting (SDXL, Illustrious, Anima).

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## GitHub Pages deployment

This repository includes `.github/workflows/deploy-pages.yml` to deploy static export output from `out/`.

### Required repository settings

1. Enable **GitHub Pages** for the repository.
2. Set source to **GitHub Actions**.

The workflow builds with `GITHUB_PAGES=true`, which automatically applies the project `basePath` and static asset prefix for project pages.

## Offline PWA

The app ships with:

- `public/manifest.webmanifest`
- `public/sw.js`
- service worker registration in production mode

After first successful load, assets are cached so the app can run offline.
