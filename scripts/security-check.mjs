import assert from 'node:assert/strict'

import {
  encodePathSegment,
  normalizeSocialUrl,
  serializeJsonLd,
} from '../src/lib/security.ts'

const jsonLd = serializeJsonLd({
  name: '</script><script>globalThis.__xss = true</script>',
})
assert.equal(jsonLd.includes('</script>'), false)

const encodedPath = encodePathSegment('../spaces/123?admin=true')
assert.equal(
  new URL(`https://api.solobeaute.com/api/v1/beauticians/${encodedPath}`).pathname,
  '/api/v1/beauticians/%2E%2E%2Fspaces%2F123%3Fadmin%3Dtrue'
)

assert.equal(normalizeSocialUrl('instagram', 'https://evil.example/phish'), null)
assert.equal(normalizeSocialUrl('instagram', 'http://instagram.com/insecure'), null)
assert.equal(
  normalizeSocialUrl('instagram', '@solobeaute'),
  'https://www.instagram.com/solobeaute'
)

console.log('Security checks passed.')
