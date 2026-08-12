export const androidAppLinksPackage = 'com.solobeauty.android'
const auditedPlaySigningFingerprints = [
  // Current and rotated Play App Signing keys, paired to their known SHA-1
  // records by the same-account Firebase Cloud Audit event sequences.
  'C7:47:53:A0:5D:A8:50:64:DB:81:D7:E3:E9:70:BF:13:30:AA:62:DF:4A:52:A5:45:10:3E:4E:9F:57:1B:47:25',
  '74:AE:2E:2B:AC:BC:A4:8E:A5:13:CD:7F:78:2A:03:5E:48:39:13:15:C2:9C:B7:B3:B1:B0:FD:79:24:CD:EC:72',
] as const

const uploadKeySha256 =
  '3C:D2:89:92:20:70:77:70:14:4B:97:A4:05:96:0B:42:12:CD:59:ED:6F:5D:90:C9:05:A3:74:B8:C8:72:26:9D'
const debugKeySha256 =
  'B4:6B:88:2C:A9:52:B3:A0:4E:0E:3E:8A:D0:90:83:10:38:56:20:38:06:70:37:3A:2E:8C:56:D6:E1:D5:40:9C'
const sha256FingerprintPattern = /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/

export function validatePlaySigningFingerprints(values: readonly string[]): string[] {
  const fingerprints = [
    ...new Set(
      values
        .map((value) => value.trim().toUpperCase())
        .filter(Boolean),
    ),
  ]

  if (fingerprints.length !== auditedPlaySigningFingerprints.length) {
    throw new Error(
      'Asset Links must contain exactly the current and rotated Play App Signing SHA-256 fingerprints',
    )
  }

  for (const fingerprint of fingerprints) {
    if (!sha256FingerprintPattern.test(fingerprint)) {
      throw new Error(`Invalid Play App Signing SHA-256 fingerprint: ${fingerprint}`)
    }
    if (fingerprint === uploadKeySha256) {
      throw new Error('The Android upload-key certificate must not be trusted for App Links')
    }
    if (fingerprint === debugKeySha256) {
      throw new Error('The Android debug certificate must not be trusted for App Links')
    }
  }

  const configuredFingerprints = new Set(fingerprints)
  for (const requiredFingerprint of auditedPlaySigningFingerprints) {
    if (!configuredFingerprints.has(requiredFingerprint)) {
      throw new Error(
        'Asset Links do not match the audited Play App Signing certificates',
      )
    }
  }

  return [...auditedPlaySigningFingerprints]
}

export const androidAppLinksPlaySigningFingerprints = Object.freeze(
  validatePlaySigningFingerprints(auditedPlaySigningFingerprints),
)

export function buildAndroidAssetLinks() {
  return [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: androidAppLinksPackage,
        sha256_cert_fingerprints: androidAppLinksPlaySigningFingerprints,
      },
    },
  ]
}
