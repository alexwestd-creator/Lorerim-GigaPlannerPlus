# GitHub Actions

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| [test.yml](workflows/test.yml) | Pull requests; pushes to `main` | `npm ci`, `npm test` |
| [deploy.yml](workflows/deploy.yml) | Pushes to `main`; manual | `npm test`, build, deploy to GitHub Pages |

## Test workflow

The test job installs dependencies with `npm ci`, then runs **`npm test`** (Vitest under `src/` plus Node built-in tests in `tools/import/lib/`).

Node **22** is used in CI to match the deploy workflow.

## Deploy workflow

On every push to `main`, the deploy workflow runs **`npm test`** first, then builds with `npm run build`, uploads `dist/` as a Pages artifact, and deploys via `actions/deploy-pages`.

### GitHub Pages setup (one-time)

1. Open **Settings → Pages** for the repository.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Merge to `main` (or run the workflow manually) to publish.

**Private repositories:** GitHub Pages for private repos requires a paid GitHub plan (Pro, Team, or Enterprise). If deploy fails with `Ensure GitHub Pages has been enabled` or a plan error, enable Pages in settings or make the repository public.

Live site (when Pages is enabled): `https://watchis.github.io/Lorerim-GigaPlannerPlus/`

## Local parity

```bash
npm ci
npm test
```

Run `npm run lint` separately when editing TypeScript/React code.

See the root [README.md](../README.md#testing) for script details.
