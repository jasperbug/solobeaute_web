# SoloBeauté Website · UI Kit **v2**

> **Status:** Realigned to production. v1 is kept as `ui_kits/website/` for comparison.

## What changed from v1

| Area | v1 (wrong) | v2 (correct) |
|---|---|---|
| **Product framing** | "Booksy for Taiwan" — consumer-first booking marketplace | Space-sharing app. Core business is B2B: hosts rent workspace to independent beauty pros. Consumer discovery is a future growth layer. |
| **Hero imagery** | 3 fake phones with made-up UI | Real app screenshots (list, map, 3D tour) — the three product pillars |
| **Role priority** | Host → Pro → Consumer (equal) | **Pro first** (they're the flywheel), then Host, then Consumer "即將開放" |
| **How it works** | One generic flow | Tabs: 屋主視角 / 職人視角 (dual persona) |
| **Founders** | Missing | Full "關於我們" section with Jasper + Lavinia real copy |
| **Copy voice** | Editorial/magazine ("revolutionize", "premium") | Jasper's actual voice — blunt, utilitarian, 台灣老闆 |
| **Gold usage** | Sprinkled throughout | Reserved **only** for the Verified badge |
| **Type** | Cormorant Garamond as primary | Noto Sans TC as primary; Cormorant only for emotional hero moments |
| **Missing components** | — | 3D-tour badge, map pin, space card, booking-status triad, chat bubbles |

## Screens in this kit
1. **Landing** — mirrors solobeaute.com section-by-section
2. **找職人 (Find a pro)** — new consumer-facing discovery page. **Directory only, no booking flow.**
3. **找空間 (Find a space)** — the primary pro-facing app view, recreated as web mock

## Files
- `index.html` — entry, routes between the 3 screens
- `App.jsx` — route shell
- `Chrome.jsx` — Header, Footer, LocaleSwitcher
- `Landing.jsx` — Hero, Ecosystem, Features, HowItWorks, About, FAQ, CTA
- `FindPros.jsx` — 找職人 directory page
- `FindSpaces.jsx` — 找空間 web-rendered app mock
- `Primitives.jsx` — Button, Badge (incl. Verified-gold + 3DTour), StatusBadge, PhoneFrame, SpaceCard, ProCard, ChatBubble, MapPin, Icon set
