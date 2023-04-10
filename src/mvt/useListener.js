import { createLibp2p } from 'libp2p'
import { webRTCStar } from '@libp2p/webrtc-star'
import { noise } from '@chainsafe/libp2p-noise'
import { mplex } from '@libp2p/mplex'

export default function useListener (
  peerId,
  listeners,
  dispatchListenersAction
) {
  console.log('Jim peerId', peerId)
  const peerIdStr = peerId.string
  const listener = listeners[peerIdStr]
  return [listener, create, log, dial]

  function create () {
    console.log('Jim request create', peerIdStr)
    dispatchListenersAction({ type: 'startListening', peerId })
    createListener(peerId, dispatchListenersAction, log)
  }

  function log (txt) {
    dispatchListenersAction({ type: 'log', peerId, payload: txt })
  }

  function dial (remotePeerId) {
    const remotePeerInfo = listener.peers[remotePeerId].peerInfo
    listener.libp2pNode.dial(remotePeerInfo)
  }
}

async function createListener (peerId, dispatchListenersAction, log) {
  const star = webRTCStar()
  const node = await createLibp2p({
    // peerInfo: new PeerInfo(peerId),
    peerId,
    addresses: {
      listen: [
        '/ip4/127.0.0.1/tcp/9090/wss/p2p-webrtc-star'
      ]
    },
    transports: [star.transport],
    connectionEncryption: [noise()],
    streamMuxers: [mplex()],
    peerDiscovery: [star.discovery]
  })

  node.addEventListener('peer:discovery', evt => {
    const peerInfo = evt.detail
    log(`Found peer ${peerInfo.id}`)
    dispatchListenersAction({ type: 'addPeer', peerId, peerInfo })
  })

  // Listen for new connections to peers
  node.addEventListener('peer:connect', evt => {
    const peerInfo = evt.detail
    log(`Connected to ${peerInfo.id}`)
    dispatchListenersAction({
      type: 'updatePeer',
      peerId,
      peerInfo,
      updatePeerFunc: peer => {
        peer.connected = true
      }
    })
  })

  // Listen for peers disconnecting
  node.addEventListener('peer:disconnect', evt => {
    const peerInfo = evt.detail
    log(`Disconnected from ${peerInfo.id}`)
    dispatchListenersAction({
      type: 'updatePeer',
      peerId,
      peerInfo,
      updatePeerFunc: peer => {
        peer.connected = false
      }
    })
  })

  await node.start()

  console.log('listening on addresses:')
  node.getMultiaddrs().forEach((addr) => {
    console.log(addr.toString())
  })
  

  // const webrtcAddr = '/ip4/0.0.0.0/tcp/9090/wss/p2p-webrtc-star'
  // libp2pNode.peerInfo.multiaddrs.add(webrtcAddr)

  dispatchListenersAction({ type: 'addLibp2pNode', peerId, node })
  log('Created node')
}
