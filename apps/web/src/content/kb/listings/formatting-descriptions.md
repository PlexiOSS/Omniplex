---
title: Markdown and HTML in Descriptions
description: How to format your bot, server or pack page with Markdown and HTML, and what's supported.
order: 6
---

Long descriptions on bot and server pages, changelog updates and blog posts all support **Markdown** and **HTML**, and you can mix the two. Short descriptions are plain text.

## Markdown

Omniplex supports GitHub-flavoured Markdown:

| You type | You get |
|---|---|
| `# Heading`, `## Smaller heading` | Headings |
| `**bold**`, `*italic*`, `~~strikethrough~~` | **bold**, *italic*, ~~strikethrough~~ |
| `[Support server](https://discord.gg/...)` | A link |
| `![Screenshot](https://...)` | An image |
| `- item` or `1. item` | Lists |
| `- [x] done` | A task list checkbox |
| `` `inline code` `` | `inline code` |
| `> quote` | A quote block |
| `---` | A divider |

Fenced code blocks get syntax highlighting when you name the language:

````
```js
client.on("ready", () => console.log("Online"));
```
````

Tables use pipes:

```
| Command | What it does |
|---|---|
| /help | Lists every command |
```

A single line break starts a new line, so you don't need two spaces at the end of a line.

## HTML

You can write HTML directly, which is useful for layouts Markdown can't do:

- **Layout**: `div`, `span`, `p`, `br`, `hr`, headings, lists and tables.
- **Text**: `b`, `strong`, `i`, `em`, `u`, `s`, `mark`, `kbd`, `sup`, `sub`, `code`, `pre`, `blockquote`.
- **Media**: `img`, `video` (with `controls` and `poster`), `audio` and `source`.
- **Collapsible sections**: `<details>` with a `<summary>`.
- **Embeds**: `<iframe>` from any https URL, for example a YouTube video or a status page.

```html
<details>
  <summary>Setup guide</summary>
  Run <kbd>/setup</kbd> in any channel and follow the prompts.
</details>
```

Links to other sites open in a new tab automatically.

## What's removed

To keep pages safe and stop one listing breaking the site's layout, some things are stripped out:

- `<script>`, `<style>`, `<svg>`, `<object>`, `<embed>`, `<noscript>` and `<template>` tags.
- `class` and `id` attributes. Use inline `style` instead. See [Styling Your Page](/kb/listings/styling-your-page).
- Event handlers like `onclick`, and `javascript:` links.

Anything removed is dropped silently, so if something doesn't appear, it's usually one of the above.

## Tips

- **Preview as you go.** Your page shows exactly what visitors will see, so check it after saving.
- **Keep images light.** Large GIFs slow your page down for everyone.
- **Use headings.** They make a long description easy to skim, which helps people decide to add your bot or join your server.
