---
title: Styling Your Page
description: Customise the look of your bot or server page with a banner, inline styles, cards, badges and embeds.
order: 7
---

Beyond the text itself, there's a lot you can do to make your page feel like yours.

## The basics

- **Banner**: upload one from your dashboard. It's the first thing people see. See [Vanity URLs and Assets](/kb/listings/vanity-and-assets).
- **Avatar and name**: these come from Discord, so change them there.
- **Vanity URL**: give your page a short, memorable address.
- **Commands and changelog**: fill in the Commands and Changelog tabs so your page shows a working, maintained bot. See [Documenting Commands](/kb/listings/documenting-commands) and [Changelog Updates](/kb/listings/changelog-updates).

## Inline styles

Your long description can use the `style` attribute on HTML elements. Styles are filtered against a list of safe properties, and anything outside it is dropped.

**Allowed properties:**

- **Colour and backgrounds**: `color`, `background`, `background-color`, including `linear-gradient(...)` and `radial-gradient(...)`.
- **Borders and shadows**: `border`, `border-color`, `border-width`, `border-style`, `border-radius`, `box-shadow`, `text-shadow`.
- **Spacing and size**: `padding`, `margin` (and their `-top`, `-right`, `-bottom` and `-left` versions), `gap`, `row-gap`, `column-gap`, `width`, `height`, `min-width`, `max-width`.
- **Text**: `font-size`, `font-weight`, `line-height`, `letter-spacing`, `text-align`, `text-transform`, `text-decoration`, `white-space`.
- **Layout**: `display`, `flex`, `flex-direction`, `flex-wrap`, `flex-grow`, `flex-shrink`, `justify-content`, `align-items`, `grid-template-columns`, `grid-template-rows`, `overflow`.
- **Effects**: `backdrop-filter: blur(...)`.

**Not allowed:** `position`, `z-index`, `font-family`, anything using `url(...)`, and any property not listed above. Colours can be hex, `rgb()`, `rgba()`, `hsl()`, `hsla()`, `white`, `black` or `transparent`, and lengths can be `px`, `rem`, `em` or `%`.

Your page is shown in both light and dark mode, so pick colours that read well on both, or set a `background` on your own blocks so the text colour is always readable.

## Examples

A feature card:

```html
<div style="padding: 16px; border-radius: 12px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white;">
  <strong style="font-size: 18px;">Auto moderation</strong>
  <p>Blocks spam, raids and bad links before your members see them.</p>
</div>
```

A row of badges:

```html
<div style="display: flex; flex-wrap: wrap; gap: 8px;">
  <span style="padding: 2px 10px; border-radius: 999px; background-color: #10b981; color: white;">Free</span>
  <span style="padding: 2px 10px; border-radius: 999px; background-color: #3b82f6; color: white;">Slash commands</span>
  <span style="padding: 2px 10px; border-radius: 999px; background-color: #f59e0b; color: white;">Dashboard</span>
</div>
```

A two-column grid:

```html
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
  <div style="padding: 12px; border: 1px solid #e4e4e7; border-radius: 10px;">Leveling</div>
  <div style="padding: 12px; border: 1px solid #e4e4e7; border-radius: 10px;">Tickets</div>
</div>
```

## Embeds

You can embed videos, trailers or a live status page with an `<iframe>` from any https URL:

```html
<iframe src="https://www.youtube.com/embed/VIDEO_ID" width="560" height="315" allowfullscreen></iframe>
```

Video and audio files work too, with `<video controls src="...">` and `<audio controls src="...">`.

## Keep it readable

- **Don't hide the important bits in images.** Text in images can't be searched or read by screen readers.
- **Check it on a phone.** Fixed widths wider than a phone screen make people scroll sideways. Prefer `max-width: 100%` and flexible layouts.
- **Stay within the [Page Rules](/kb/bots/page-rules).** Styling doesn't change what's allowed on the page.
