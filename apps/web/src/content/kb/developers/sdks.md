---
title: Official SDKs
description: Post stats, check votes and verify webhooks from JavaScript, TypeScript, Python, Go or Rust with our official libraries.
order: 6
---

Our official SDKs handle the parts of the API that bots use most: posting your stats, checking whether someone voted, and verifying [vote webhooks](/kb/developers/vote-webhooks). They retry for you when you're rate limited, and their webhook helpers support every signing method Omniplex uses.

| Language | Package | Install | Guide |
|---|---|---|---|
| JavaScript and TypeScript | [`@omniplex/sdk`](https://www.npmjs.com/package/@omniplex/sdk) | `npm install @omniplex/sdk` | [JavaScript guide](https://docs.omniplex.gg/docs/sdks/javascript) |
| Python | [`omniplex-sdk`](https://pypi.org/project/omniplex-sdk/) | `pip install omniplex-sdk` | [Python guide](https://docs.omniplex.gg/docs/sdks/python) |
| Go | [`github.com/PlexiOSS/Omniplex/packages/sdk-go`](https://pkg.go.dev/github.com/PlexiOSS/Omniplex/packages/sdk-go) | `go get github.com/PlexiOSS/Omniplex/packages/sdk-go` | [Go guide](https://docs.omniplex.gg/docs/sdks/go) |
| Rust | [`omniplex`](https://crates.io/crates/omniplex) | `cargo add omniplex` | [Rust guide](https://docs.omniplex.gg/docs/sdks/rust) |

Posting stats needs an [API token](/kb/developers/api-tokens) for your bot or server. Checking votes and reading public listings don't.

Each guide walks through posting stats, checking votes and handling webhooks, with examples for popular Discord libraries. Start with the [SDK overview](https://docs.omniplex.gg/docs/sdks) in the developer docs.

All of the SDKs are open source under the MIT licence in our [GitHub repository](https://github.com/PlexiOSS/Omniplex/tree/master/packages), where you can also report problems.
