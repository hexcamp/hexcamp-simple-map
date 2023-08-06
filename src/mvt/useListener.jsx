import { createLibp2p } from 'libp2p'

import { circuitRelayTransport } from 'libp2p/circuit-relay'
import { webRTC } from '@libp2p/webrtc'
import { webSockets } from '@libp2p/websockets'
import * as filters from '@libp2p/websockets/filters'

import { noise } from '@chainsafe/libp2p-noise'
import { mplex } from '@libp2p/mplex'

import { identifyService } from 'libp2p/identify'
import { pingService } from 'libp2p/ping'

import { MemoryBlockstore } from 'blockstore-core'
import { MemoryDatastore } from 'datastore-core'
import { createHelia } from 'helia'
import { unixfs } from '@helia/unixfs'

export default function useListener (
  peerId,
  listeners,
  neighbours,
  dispatchListenersAction,
  dispatchCellsAction,
  addHex
) {
  const peerIdStr = peerId.string
  const listener = listeners[peerIdStr]
  return [listener, create, log, dial]

  function create () {
    dispatchListenersAction({ type: 'startListening', peerId })
    createListener(
      peerId,
      dispatchListenersAction,
      dispatchCellsAction,
      log,
      neighbours,
      addHex
    )
  }

  function log (txt) {
    dispatchListenersAction({ type: 'log', peerId, payload: txt })
  }

  function dial (remotePeerId) {
    const remotePeerInfo = listener.peers[remotePeerId].peerInfo
    listener.libp2pNode.dial(remotePeerInfo)
  }
}

async function createListener (
  peerId,
  dispatchListenersAction,
  dispatchCellsAction,
  log,
  neighbours
) {
  const node = await createLibp2p({
    peerId,
    addresses: {
      listen: ['/webrtc']
    },
    transports: [
      webSockets({
        filter: filters.all
      }),
      webRTC(),
      circuitRelayTransport({
        discoverRelays: 1
      })
    ],
    connectionEncryption: [noise()],
    streamMuxers: [mplex()],
    connectionGater: {
      denyDialPeer: async incomingPeerId => {
        console.log(
          'Jim denyDialPeer',
          peerId.string,
          'Incoming',
          incomingPeerId
        )
        if (incomingPeerId.string === '12D3KooWDpJ7As7BWAwRMfu1VU2WCqNjvq387JEYKDBj4kx6nXTN') {
          console.log('Match: WebRTC relay')
          return false
        }
        const neighbourHexes = await neighbours
        console.log('Neighbours', neighbourHexes)
        const isNeighbour = neighbourHexes.has(incomingPeerId.string)
        console.log('Is neighbour?', isNeighbour)
        return !isNeighbour
      }
    },
    services: {
      identify: identifyService(),
      ping: pingService({
        protocolPrefix: 'ipfs', // default
      }),
    },
  })

  node.addEventListener('peer:discovery', async evt => {
    const remotePeerId = evt?.detail?.id
    if (remotePeerId?.string) {
      // log(`Found peer ${remotePeerId.string}`)
      console.log('Jim peer:discovery', peerId.string, remotePeerId.string)
      dispatchListenersAction({ type: 'addPeer', peerId, remotePeerId })
      try {
        console.log('Dialing', remotePeerId.string)
        const conn = await node.dial(remotePeerId)
        console.log('Jim connected', conn)
        const neighbour = neighbours.get(remotePeerId.string)
        if (neighbour) {
          dispatchCellsAction({ type: 'addHex', hex: neighbour, extra: {
            remote: true
          } })
        }
      } catch (e) {
        console.log('Dial Exception', e)
      }
    }
  })

  // Listen for new connections to peers
  node.addEventListener('peer:connect', evt => {
    const remotePeerId = evt?.detail?.remotePeer
    if (remotePeerId?.string) {
      log(`Connected to ${remotePeerId.string}`)
      console.log('Jim peer:connect', peerId.string, remotePeerId.string)
      const neighbour = neighbours.get(remotePeerId.string)
      if (neighbour) {
        dispatchCellsAction({ type: 'addHex', hex: neighbour, extra: {
          remote: true
        } })
      }
      dispatchListenersAction({
        type: 'updatePeer',
        peerId,
        remotePeerId,
        updatePeerFunc: peer => {
          peer.connected = true
        }
      })
    }
  })

  // Listen for peers disconnecting
  node.addEventListener('peer:disconnect', evt => {
    const remotePeerId = evt?.detail?.remotePeer
    if (remotePeerId?.string) {
      log(`Disconnected from ${remotePeerId.string}`)
      console.log('Jim peer:disconnect', peerId.string, remotePeerId.string)
      dispatchListenersAction({
        type: 'updatePeer',
        peerId,
        remotePeerId,
        updatePeerFunc: peer => {
          peer.connected = false
        }
      })
    }
  })

  await node.start()

  console.log('Jim node', node)

  console.log('listening on addresses:')
  node.getMultiaddrs().forEach((addr) => {
    console.log(addr.toString())
  })

  dispatchListenersAction({ type: 'addLibp2pNode', peerId, libp2pNode: node })
  log('Created libp2p node')

  const heliaNode = await createHeliaNode(node)
  console.log('Jim helia node', heliaNode)
}

async function createHeliaNode (libp2p) {

  // the blockstore is where we store the blocks that make up files
  const blockstore = new MemoryBlockstore()

  // application-specific data lives in the datastore
  const datastore = new MemoryDatastore()

  const helia = await createHelia({
    datastore,
    blockstore,
    libp2p
  })

  const fs = unixfs(helia)

  const encoder = new TextEncoder()

  const text = "Hello from Helia!"

  try {
    const cid = await fs.addBytes(
      encoder.encode(text),
      helia.blockstore
    )
    console.log('Added file:', cid.toString())
  } catch (e) {
    console.error(e)
  }

  // CID: bafkreih24rri3mto2pqfduo57vkuhymckmam3rlfd2plvrirhmp6o5x6mq

  return helia
}