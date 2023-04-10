import sodium from 'sodium-universal'
import { createFromPrivKey } from '@libp2p/peer-id-factory'
import { marshalPrivateKey, supportedKeys } from '@libp2p/crypto/keys'
import { Buffer } from 'buffer'

// https://libsodium.gitbook.io/doc/key_derivation
// https://github.com/mafintosh/hyperdrive/blob/a4b3a82e84877b4ddcf38fffd1db342a861a863a/index.js#L904

export default async function getPeerIdFromH3HexAndSecret (h3Hex, secretHex) {
  const secret = Buffer.from(secretHex, 'hex')
  const subKey1 = new Buffer(sodium.crypto_sign_SEEDBYTES)
  const context = Buffer.from(h3Hex + 'f', 'hex') // Add half a byte to make 8
  const publicKey = new Buffer(sodium.crypto_sign_PUBLICKEYBYTES)
  const secretKey = new Buffer(sodium.crypto_sign_SECRETKEYBYTES)

  sodium.crypto_kdf_derive_from_key(subKey1, 1, context, secret)
  sodium.crypto_sign_seed_keypair(publicKey, secretKey, subKey1)
  if (subKey1.fill) subKey1.fill(0)

  // const privKey = marshalPrivateKey(
  const privKey = new supportedKeys.ed25519.Ed25519PrivateKey(
      secretKey,
      publicKey
    )

  /*
    'ed25519'
  )
  */
  console.log('Jim1 privKey', privKey)

  // const peerId = await PeerId.createFromPrivKey(privKey)
  const peerId = await createFromPrivKey(privKey)
  console.log('Jim1 peerId', peerId, privKey)

  return peerId
}
