# Tear website: development plan

The current published homepage and spell prototype are preserved in the root `index.html` and `spells.html` files. This branch prepares an Astro-generated replacement without touching the published version.

## Architecture

- `src/pages/index.astro`: homepage migrated from the working HTML draft
- `src/pages/spells.astro`: interactive two-spell prototype migrated from the working HTML draft
- `public/spells.html`: backwards-compatible link redirect to `/spells/`
- `astro.config.mjs`: GitHub Pages domain and repository subpath
- `.github/workflows/verify-astro.yml`: checks that all pages build on pull requests
- `.github/workflows/deploy-astro.yml`: deploys the generated `dist/` folder after merging to `main`

This initial migration preserves the spell data and design as-is. The **next** technical task will be to extract spell data into a structured file and develop a read-only Google Sheets converter; do not claim that live sync exists yet.

## Local development

Requires Node.js 24 or later.

```bash
npm install
npm run dev
npm run build
```

Astro requires a build command; unlike the original standalone HTML demo, its source files should not be opened directly in Chrome. The built static files work on ordinary static hosts.

**Caution:** This draft does not yet include a generated `package-lock.json`; the dependency version is pinned, but lockfile creation and checking it in is a follow-up once installation has been run in a networked development environment.

## Deploying

**Before merging this branch**, confirm the pull request's Astro build check succeeds. In repository Settings → Pages → Build and deployment, switch the publishing Source from **Deploy from a branch** to **GitHub Actions**. Then merge this branch. GitHub Actions will build and deploy the new Astro site. Do not change DNS or the custom domain yet.

## Public data

The repository is public. Do not commit credentials, API tokens, private campaign details, or unpublished worldbuilding files.
