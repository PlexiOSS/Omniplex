# Omniplex brand kit

Everything here is generated from the Omniplex mark and the Geist typeface, so the kit stays consistent. Use the files as they are rather than recreating them.

## Colours

| Name | Hex | Use |
|---|---|---|
| Indigo | `#6366f1` | Primary brand colour, the accent piece of the mark |
| Deep indigo | `#4943cb` | Gradients, the original logo accent |
| Violet | `#8b5cf6` | Secondary glow |
| Lilac | `#c7d2fe` | The mark's accent piece on indigo backgrounds |
| Ink | `#09090b` | Backgrounds |
| White | `#fafafa` | The mark and text on dark backgrounds |
| Muted | `#a1a1aa` | Secondary text |

Typeface: **Geist** (SemiBold for the wordmark, Medium for supporting text).

## Logo (`logo/`)

| File | Use on |
|---|---|
| `omniplex-mark` | Dark backgrounds (white with an indigo accent) |
| `omniplex-mark-dark` | Light backgrounds |
| `omniplex-mark-indigo` | Either; good for small or single-colour placements |
| `omniplex-mark-white` / `-black` | One-colour print, overlays and watermarks |
| `omniplex-wordmark` / `-dark` | The mark with "Omniplex", for dark / light backgrounds |
| `omniplex-app-icon` | App and profile icons |

Every mark comes as SVG plus 512 and 1024 PNGs. Leave clear space around the mark of at least a quarter of its width, and don't recolour, stretch or rotate it outside the seasonal sets.

## Icons (`icons/`)

`favicon.svg`, `favicon-16/32/48.png`, `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (full bleed, for Android), and `discord-avatar-1024.png` for the bot and server profile pictures.

## Banners (`banners/`)

The backgrounds show real bots listed on Omniplex.

| File | Where |
|---|---|
| `twitter-header-1500x500` | X / Twitter header (content sits right of the profile picture) |
| `github-social-preview-1280x640` | GitHub repo Settings, Social preview |
| `github-readme-banner-1280x320` | Top of READMEs |
| `og-default-1200x630` | Default link preview |
| `discord-server-banner-960x540` | Discord server banner (Boost level 2) |
| `discord-invite-splash-1920x1080` | Discord invite background (Boost level 1) |
| `linkedin-banner-1584x396` | LinkedIn page cover |
| `youtube-banner-2560x1440` | YouTube channel art (text sits inside the safe area) |

## Emojis (`emojis/`)

128×128, transparent, and under Discord's 256 KB limit. The file names are ready to use as emoji names.

- Static: `omniplex`, `omniplex_mark`, `upvote`, `downvote`, `vote`, `certified`, `premium`, `partner`, `staff`, `bot`, `trophy`, `trending`, `sparkles`, `heart`, `new`, `check`, `cross`, and `status_online` / `_idle` / `_dnd` / `_offline`.
- Animated (`animated/`, GIF): `omniplex_spin`, `loading`, `upvote_bounce`, `online_pulse`, `sparkles_twinkle`, `heart_beat`, `certified_shine`.
- `svg/` has the vector source of every static emoji.

## Stickers (`stickers/`)

320×320 with a die-cut white outline, and under Discord's 512 KB limit.

- Static PNG: `thanks_for_voting`, `vote_for_us`, `certified`, `youre_listed`, `welcome`, `new_update`, `gg`, `omniplex`.
- Animated GIF (`animated/`): `vote_animated`, `omniplex_hello`, `certified_shine`, `gg_animated`, `thanks_animated`.

## Bots (`bots/`)

Each Omniplex bot has its own sub-brand: the Omniplex mark in the bot's colour, plus a badge for what it does.

| Bot | Role | Colour | Badge |
|---|---|---|---|
| `popplio` | The official Omniplex bot | Indigo | Chat bubble |
| `infernoplex` | Server listings, kept in sync | Ember / flame | Flame |
| `arcadia` | Staff tools for Omniplex | Teal | Shield |

Each folder has:

- `avatar-1024.png` and `avatar.svg`: the Discord profile picture (the badge stays inside Discord's circle crop)
- `avatar-animated.gif`: the animated profile picture (512)
- `app-icon-1024.png`: a rounded-corner version
- `emoji-<bot>.png`: the bot's logo emoji
- `lockup.png` / `lockup-dark.png`: the icon, name and "by Omniplex"
- `discord-profile-banner-1360x480.png`, `readme-banner-1280x320.png` and `social-preview-1280x640.png`

## Seasonal and regular themes (`themes/`)

Each theme folder has:

- `server-icon-1024.png`: static server or profile icon
- `server-icon-animated.gif`: animated server icon (512, needs Boost level 1)
- `app-icon-1024.png`: rounded-corner version
- `emoji-omniplex_<theme>.png`: themed logo emoji
- `discord-server-banner-960x540.png` and `twitter-header-1500x500.png`

| Theme | When |
|---|---|
| `regular` | Default, all year |
| `valentines` | 1 to 14 February |
| `st_patricks` | 10 to 17 March |
| `spring` | March to May |
| `earth_day` | 20 to 22 April |
| `pride` | June |
| `canada_day` | 1 July |
| `summer` | July and August |
| `autumn` | September to mid October, and November |
| `truth_reconciliation` | 30 September (National Day for Truth and Reconciliation, Orange Shirt Day) |
| `halloween` | Mid October to 31 October |
| `remembrance` | 1 to 11 November |
| `winter` | Early December and January |
| `holiday` | Mid December to 26 December |
| `new_year` | 27 December to 2 January |

Swap the server icon, banner and Twitter header together, and switch back to `regular` when the season ends. A day theme (St. Patrick's Day, Earth Day, Canada Day, Truth and Reconciliation, Remembrance) takes priority over the season it falls in. `truth_reconciliation` and `remembrance` are deliberately calm: no falling particles, only a slow shine on the animated icon.
