import { createLibp2p } from 'libp2p'
import { webRTCStar } from '@libp2p/webrtc-star'
import { noise } from '@chainsafe/libp2p-noise'
import { mplex } from '@libp2p/mplex'
import { MemoryBlockstore } from 'blockstore-core'
import { MemoryDatastore } from 'datastore-core'
import { createHelia } from 'helia'

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
  const star = webRTCStar()
  const node = await createLibp2p({
    peerId,
    addresses: {
      // listen: ['/ip4/127.0.0.1/tcp/9090/wss/p2p-webrtc-star']
      // listen: ['/ip4/192.168.1.80/tcp/9090/wss/p2p-webrtc-star']
      listen: ['/dns4/hexcamp-webrtc-star-dev.quick.cluster-4.localnet.farm/tcp/443/wss/p2p-webrtc-star']
    },
    transports: [star.transport],
    connectionEncryption: [noise()],
    streamMuxers: [mplex()],
    peerDiscovery: [star.discovery],
    connectionGater: {
      denyDialPeer: async incomingPeerId => {
        console.log(
          'Jim denyDialPeer',
          peerId.string,
          'Incoming',
          incomingPeerId.string
        )
        const neighbourHexes = await neighbours
        console.log('Neighbours', neighbourHexes)
        const isNeighbour = neighbourHexes.has(incomingPeerId.string)
        console.log('Is neighbour?', isNeighbour)
        return !isNeighbour
      }
    }
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

  dispatchListenersAction({ type: 'addLibp2pNode', peerId, node })
  log('Created libp2p node')

  const helia = await createHeliaNode(node)
  console.log('Jim helia node', helia)
  dispatchListenersAction({ type: 'addHeliaNode', peerId, helia })
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

  return helia
}