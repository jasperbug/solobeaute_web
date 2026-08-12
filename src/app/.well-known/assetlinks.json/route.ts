import {
  androidAppLinksFingerprintEnv,
  buildAndroidAssetLinks,
  parsePlaySigningFingerprints,
} from '@/lib/android-app-links'

export const dynamic = 'force-dynamic'

export function GET() {
  try {
    const fingerprints = parsePlaySigningFingerprints(
      process.env[androidAppLinksFingerprintEnv],
    )

    return Response.json(buildAndroidAssetLinks(fingerprints), {
      headers: {
        'Cache-Control': 'public, max-age=300, must-revalidate',
      },
    })
  } catch {
    return Response.json(
      { error: 'Android App Links signing certificates are not configured.' },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      },
    )
  }
}
