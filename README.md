# SoloBeauté Web

Next.js 14 App Router web frontend for `www.solobeaute.com`.

## Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- `next-intl`

## Routes

- `/`
- `/search`
- `/beautician/[slug]`
- `/share/[type]/[id]`
- `/privacy`
- `/terms`
- `/support`
- `/login`

## Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm run build
```

## Environment Variables

```bash
NEXT_PUBLIC_API_URL=https://api.solobeaute.com/api/v1
NEXT_PUBLIC_SITE_URL=https://www.solobeaute.com
```

## Notes

- Public beautician visibility is controlled by backend/admin, not by frontend-only filtering.
- `/search` and brand pages are expected to reflect admin visibility changes without stale cached exposure.
- Share pages keep the existing `/share/*` deep-link semantics for app handoff and OG previews.
