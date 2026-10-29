# Releasing

Everything in this repo is released by pushing a git tag. Each tag starts one workflow.

| What | Tag | Workflow | Goes to |
|---|---|---|---|
| Website | `v1.10.0` | `docker.yml` | `ghcr.io/plexioss/omniplex` |
| JS SDK | `sdk-js@v0.1.0` | `publish-npm.yml` | npm, `@omniplex/sdk` |
| API types | `api-types@v0.1.0` | `publish-npm.yml` | npm, `@omniplex/api-types` |
| Python SDK | `sdk-python@v0.1.0` | `publish-pypi.yml` | PyPI, `omniplex-sdk` |

The npm and PyPI workflows use trusted publishing: GitHub Actions proves to the registry which repo and workflow is publishing, so no registry tokens are stored in GitHub. Before the first release you need the one-time setup below.

## One-time setup

### GitHub

In the repo's **Settings → Environments**, create two environments: `npm` and `pypi`. The publishing jobs run in them. You can add yourself as a required reviewer so every publish waits for your approval.

### npm

npm only lets you add a trusted publisher to a package that already exists, so the very first version of each package is published by hand.

1. Create the `omniplex` organization at [npmjs.com](https://www.npmjs.com) (**Add Organization**, free for public packages). The packages are scoped to it.
2. Publish both packages once from your machine, types first, since the SDK depends on them:

   ```bash
   npm login
   bun install
   bunx turbo run build --filter=./packages/*
   cd packages/api-types && bun pm pack && npm publish omniplex-api-types-0.1.0.tgz --access public && cd ../..
   cd packages/sdk-js && bun pm pack && npm publish omniplex-sdk-0.1.0.tgz --access public && cd ../..
   ```

   Use `bun pm pack` rather than `npm publish` from the folder. It turns the SDK's `workspace:^` dependency into a real version range.
3. On npmjs.com, open each package's **Settings → Trusted Publisher → GitHub Actions** and enter:
   - Organization or user: `PlexiOSS`
   - Repository: `Orbiplex`
   - Workflow filename: `publish-npm.yml`
   - Environment: `npm`
4. Optionally, under the same settings, choose **Require two-factor authentication and disallow tokens**, so only the workflow can publish from now on.

### PyPI

PyPI lets you register the trusted publisher before the project exists, so the first release can come from the workflow.

1. On [pypi.org](https://pypi.org), go to **Your account → Publishing → Add a new pending publisher** and enter:
   - PyPI project name: `omniplex-sdk`
   - Owner: `PlexiOSS`
   - Repository name: `Orbiplex`
   - Workflow name: `publish-pypi.yml`
   - Environment name: `pypi`
2. Push the first `sdk-python@v…` tag. The project is created on PyPI when it publishes.

The name `omniplex` on PyPI is taken by an unrelated project from 2023, which is why the distribution is `omniplex-sdk`. It still imports as `omniplex`. If you ever want the bare name, PyPI handles transfers of abandoned names through a [PEP 541](https://peps.python.org/pep-0541/) request.

If the GitHub repo is renamed again, update the repository name in every trusted publisher, or publishing will be refused.

## Releasing a package

1. Bump the version:
   - JS packages: `version` in the package's `package.json`.
   - Python SDK: `__version__` in `packages/sdk-python/src/omniplex/__init__.py`.
2. In the package's `CHANGELOG.md`, move the `[Unreleased]` entries under a new version heading with today's date.
3. Commit, then tag and push:

   ```bash
   git tag sdk-js@v0.2.0
   git push origin sdk-js@v0.2.0
   ```

The workflow refuses to publish if the tag's version doesn't match the package. It runs the package's lint, typecheck and tests first, and npm releases get a provenance attestation linking them to the workflow run.

If an SDK release needs new types, release `api-types` first. The SDK depends on a `^` range of it.

## Releasing the website

Unchanged from before the monorepo: bump `version` in `apps/web/package.json`, move `apps/web/CHANGELOG.md`'s `[Unreleased]` entries under the new version, commit, and push a `v<version>` tag. Dokploy builds production from the `Dockerfile` at the repo root, and the tag also publishes the image to GHCR.
