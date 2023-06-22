import base32 from 'base32.js'
import { Buffer } from 'buffer'

export default function (h3Index) {
  if (!h3Index) return ''
  let trimmed = h3Index.replace(/f*$/, '')
  if (trimmed[0] !== '8') return 'Error'
  if (trimmed.length % 2 == 0) {
    trimmed += 'f'
  }
  const buf = Buffer.from(trimmed.slice(1), 'hex')
  const encoder = new base32.Encoder({ type: 'rfc4648', lc: true })
  const str = encoder.write(buf).finalize()
  return str
}
