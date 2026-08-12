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
  androidAppLinksPackage,
  androidAppLinksPlaySigningFingerprints,
  buildAndroidAssetLinks,
  validatePlaySigningFingerprints,
} = await import(moduleDataUrl)

const fingerprint = (octet) => Array(32).fill(octet).join(':')
const [currentPlayFingerprint, rotatedPlayFingerprint] =
  androidAppLinksPlaySigningFingerprints
const uploadKeyFingerprint =
  '3C:D2:89:92:20:70:77:70:14:4B:97:A4:05:96:0B:42:12:CD:59:ED:6F:5D:90:C9:05:A3:74:B8:C8:72:26:9D'
const debugKeyFingerprint =
  'B4:6B:88:2C:A9:52:B3:A0:4E:0E:3E:8A:D0:90:83:10:38:56:20:38:06:70:37:3A:2E:8C:56:D6:E1:D5:40:9C'

assert.deepEqual(
  validatePlaySigningFingerprints([
    currentPlayFingerprint.toLowerCase(),
    rotatedPlayFingerprint,
  ]),
  [currentPlayFingerprint, rotatedPlayFingerprint],
)
assert.throws(() => validatePlaySigningFingerprints([]), /current and rotated/)
assert.throws(
  () => validatePlaySigningFingerprints([currentPlayFingerprint]),
  /current and rotated/,
)
assert.throws(
  () => validatePlaySigningFingerprints([currentPlayFingerprint, 'not-a-certificate']),
  /Invalid Play App Signing/,
)
assert.throws(
  () => validatePlaySigningFingerprints([currentPlayFingerprint, uploadKeyFingerprint]),
  /upload-key/,
)
assert.throws(
  () => validatePlaySigningFingerprints([currentPlayFingerprint, debugKeyFingerprint]),
  /debug/,
)
assert.throws(
  () => validatePlaySigningFingerprints([currentPlayFingerprint, fingerprint('AA')]),
  /do not match the audited/,
)
assert.throws(
  () =>
    validatePlaySigningFingerprints([
      currentPlayFingerprint,
      rotatedPlayFingerprint,
      fingerprint('BB'),
    ]),
  /must contain exactly/,
)

assert.deepEqual(buildAndroidAssetLinks(), [
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
