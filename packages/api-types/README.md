# @omniplex/api-types

TypeScript types for the [Omniplex](https://omniplex.gg) API (Popplio): bots, servers, users, teams, votes, reviews and the rest of the public payloads.

```sh
npm install @omniplex/api-types
```

```ts
import type { Bot, UserVote } from "@omniplex/api-types";
```

This package only contains types. If you want a client that calls the API for you, use [`@omniplex/sdk`](https://www.npmjs.com/package/@omniplex/sdk), which depends on this package.

The types follow Popplio's Go structs. If a field here disagrees with what the API returns, the API is right, so please [open an issue](https://github.com/PlexiOSS/Orbiplex/issues).
