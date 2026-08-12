import { buildAndroidAssetLinks } from '@/lib/android-app-links'

export const dynamic = 'force-static'

export function GET() {
  return Response.json(buildAndroidAssetLinks(), {
    headers: {
      'Cache-Control':
        'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
