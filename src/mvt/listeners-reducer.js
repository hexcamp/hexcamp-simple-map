import produce from 'immer'

export default function listenersReducer (listeners, action) {
  const { type, peerId, libp2pNode, peerInfo } = action
  switch (type) {
    case 'startListening':
      return startListening(peerId)
    case 'addLibp2pNode':
      return addLibp2pNode(peerId, libp2pNode)
    case 'log':
      const { payload } = action
      return log(peerId, payload)
    case 'addPeer':
      return addPeer(peerId, peerInfo)
    case 'updatePeer':
      const { updatePeerFunc } = action
      return updatePeer(peerId, peerInfo, updatePeerFunc)
    default:
      throw new Error()
  }

  function startListening (peerId) {
    const peerIdStr = peerId.string
    const nextListeners = produce(listeners, draftListeners => {
      draftListeners[peerIdStr] = {
        peerId,
        logs: [],
        peers: {}
      }
    })
    return nextListeners
  }

  function addLibp2pNode (peerId, libp2pNode) {
    const peerIdStr = peerId.string
    const nextListeners = produce(listeners, draftListeners => {
      draftListeners[peerIdStr].libp2pNode = libp2pNode
    })
    return nextListeners
  }

  function log (peerId, txt) {
    const peerIdStr = peerId.string
    const nextListeners = produce(listeners, draftListeners => {
      const nextLogs = produce(draftListeners[peerIdStr].logs, draftLogs => {
        draftLogs.push(txt)
      })
      draftListeners[peerIdStr].logs = nextLogs
    })
    return nextListeners
  }

  function addPeer (peerId, peerInfo) {
    const peerIdStr = peerId.string
    const nextListeners = produce(listeners, draftListeners => {
      const nextPeers = produce(draftListeners[peerIdStr].peers, draftPeers => {
        const peerIdRemote = peerInfo.id
        if (!draftPeers[peerIdRemote]) {
          draftPeers[peerIdRemote] = {
            peerInfo: peerInfo,
            connected: false
          }
        }
      })
      draftListeners[peerIdStr].peers = nextPeers
    })
    return nextListeners
  }

  function updatePeer (peerId, peerInfo, updatePeerFunc) {
    const peerIdStr = peerId.string
    let nextListeners = addPeer(peerId, peerInfo)
    nextListeners = produce(nextListeners, draftListeners => {
      const nextPeers = produce(draftListeners[peerIdStr].peers, draftPeers => {
        const peerIdRemote = peerInfo.id
        const peer = draftPeers[peerIdRemote]
        updatePeerFunc(peer)
      })
      draftListeners[peerIdStr].peers = nextPeers
    })
    return nextListeners
  }
}
