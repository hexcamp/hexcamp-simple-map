// import sodium from 'sodium-universal'
import { createFromPrivKey } from '@libp2p/peer-id-factory'
import { generateKeyPairFromSeed } from '@libp2p/crypto/keys'
import { Buffer } from 'buffer'

export default async function getPeerIdFromH3Hex (h3Hex) {
  const seedContents = Buffer.from(h3Hex + 'f', 'hex') // Add half a byte to make 8
  const seed = new Uint8Array(32)
  seed.set(seedContents)

  const privKey = await generateKeyPairFromSeed('ed25519', seed)
  const peerId = await createFromPrivKey(privKey)

  return peerId
}
