import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const moduleUrl = new URL('../src/lib/android-app-links.ts', import.meta.url)
const source = await readFile(moduleUrl, 'utf8')
const outputText = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText
const moduleDataUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
const {
  androidAppLinksFingerprintEnv,
  androidAppLinksPackage,
  androidAppLinksPlaySigningFingerprints,
  buildAndroidAssetLinks,
  parsePlaySigningFingerprints,
} = await import(moduleDataUrl)

const fingerprint = (octet) => Array(32).fill(octet).join(':')
const [currentPlayFingerprint, rotatedPlayFingerprint] =
  androidAppLinksPlaySigningFingerprints
const uploadKeyFingerprint =
  '3C:D2:89:92:20:70:77:70:14:4B:97:A4:05:96:0B:42:12:CD:59:ED:6F:5D:90:C9:05:A3:74:B8:C8:72:26:9D'

assert.equal(androidAppLinksFingerprintEnv, 'ANDROID_APP_LINKS_SHA256_FINGERPRINTS')
assert.deepEqual(
  parsePlaySigningFingerprints(
    `${currentPlayFingerprint.toLowerCase()},\n${rotatedPlayFingerprint}`,
  ),
  [currentPlayFingerprint, rotatedPlayFingerprint],
)
assert.throws(() => parsePlaySigningFingerprints(undefined), /current and rotated/)
assert.throws(
  () => parsePlaySigningFingerprints(currentPlayFingerprint),
  /current and rotated/,
)
assert.throws(
  () => parsePlaySigningFingerprints(`${currentPlayFingerprint},not-a-certificate`),
  /Invalid Play App Signing/,
)
assert.throws(
  () => parsePlaySigningFingerprints(`${currentPlayFingerprint},${uploadKeyFingerprint}`),
  /upload-key/,
)
assert.throws(
  () => parsePlaySigningFingerprints(`${currentPlayFingerprint},${fingerprint('AA')}`),
  /does not match the audited/,
)
assert.throws(
  () =>
    parsePlaySigningFingerprints(
      `${currentPlayFingerprint},${rotatedPlayFingerprint},${fingerprint('BB')}`,
    ),
  /must contain exactly/,
)

assert.deepEqual(buildAndroidAssetLinks([currentPlayFingerprint, rotatedPlayFingerprint]), [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: androidAppLinksPackage,
      sha256_cert_fingerprints: [currentPlayFingerprint, rotatedPlayFingerprint],
    },
  },
])

console.log('Digital Asset Links configuration passed.')
