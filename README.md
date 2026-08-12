# SoloBeauté Web

Next.js 14 App Router web frontend for `www.solobeaute.com`.

## Android App Links

`src/app/.well-known/assetlinks.json/route.ts` delegates canonical share URLs
on `www.solobeaute.com` to `com.solobeauty.android`. Configure the Vercel
environment variable `ANDROID_APP_LINKS_SHA256_FINGERPRINTS` with the current
and rotated Google Play App Signing SHA-256 fingerprints, separated by a comma
or newline. Copy both values directly from Play Console > App integrity; a
SHA-256 value cannot be reconstructed from its SHA-1 fingerprint.

The accepted pair is pinned in code to the current and rotated certificates
whose SHA-1/SHA-256 pairings are backed by same-account Firebase Cloud Audit
event sequences from 2026-07-30 and 2026-07-27. Runtime configuration must
match that audited pair exactly; extra certificates are rejected.

The route deliberately returns `503` when either certificate is missing,
malformed, or when the known local upload-key certificate is supplied. This
prevents a plausible-looking but unverifiable statement from reaching
production. `npm run build` runs `npm run check:assetlinks` first to preserve
these constraints.

After deploying, verify the endpoint itself without following redirects:

```sh
curl -i --max-redirs 0 https://www.solobeaute.com/.well-known/assetlinks.json
```

It must return `200` with `Content-Type: application/json`. Android uses only
the `www` host; the apex domain may continue redirecting to `www` without
affecting App Links verification.

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
- `/delete-account`
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
