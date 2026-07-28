# Contributing to Omniplex

Thanks for taking the time to contribute. This document covers how to get set up, the conventions we follow, and how to submit changes.

By participating in this project, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting set up

1. Fork the repository and clone your fork.
2. Install [Bun](https://bun.sh) if you don't already have it.
3. Install dependencies:

   ```bash
   bun install
   ```

4. Start the dev server:

   ```bash
   bun dev
   ```

The app runs against the staging API by default, so no additional configuration is needed to start developing. See the README for the full list of environment variables if you need to point at a different backend.

## Before you start

For anything beyond a small fix, open an issue first to discuss the change. This avoids duplicated work and makes sure the approach fits the project before you invest time in it.

## Making changes

- Create a branch off `main` with a descriptive name, for example `fix/server-vote-count` or `feat/pack-editing`.
- Keep pull requests focused on a single change. Unrelated fixes should be their own PR.
- Match the existing code style. Run `bun run lint` before committing; `bun run format` will fix most issues automatically.
- Follow the conventions documented in [AGENTS.md](AGENTS.md): component structure, the `zinc` color scale for neutrals, dark mode via the `dark:` prefix, and the API layer's separation between `src/lib/api/` and the rest of the app.
- Prefer server components unless a component needs hooks, event handlers, or browser APIs.
- Don't introduce new dependencies for something a few lines of code can handle.

## Commit messages

Write commit messages that explain why a change was made, not just what changed. Keep the summary line under about 70 characters.

## Submitting a pull request

1. Push your branch and open a pull request against `main`.
2. Describe what the PR does and why. Link any related issues.
3. Make sure `bun run lint` and `bun run build` both pass.
4. Be responsive to review feedback. We may ask for changes before merging.

## Reporting bugs

Open an issue with steps to reproduce, what you expected to happen, and what actually happened. Screenshots help for anything visual.

## Reporting security issues

Do not open a public issue for security vulnerabilities. See [SECURITY.md](SECURITY.md) instead.

## Questions

If something in this guide is unclear, open an issue or ask in our [Discord server](https://discord.gg/KBCRuBKrHe).
