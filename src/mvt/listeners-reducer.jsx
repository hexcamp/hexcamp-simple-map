import produce from 'immer'
import { unixfs } from '@helia/unixfs'
import { CID } from 'multiformats/cid'

export default function listenersReducer (listeners, action) {
  const { type, peerId, libp2pNode, remotePeerId, helia } = action
  switch (type) {
    case 'startListening':
      return startListening(peerId)
    case 'addLibp2pNode':
      return addLibp2pNode(peerId, libp2pNode)
    case 'addHeliaNode':
      return addHeliaNode(peerId, helia)
    case 'download':
      return download(peerId)
    case 'log':
      const { payload } = action
      return log(peerId, payload)
    case 'addPeer':
      return addPeer(peerId, remotePeerId)
    case 'updatePeer':
      const { updatePeerFunc } = action
      return updatePeer(peerId, remotePeerId, updatePeerFunc)
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

  function addHeliaNode (peerId, helia) {
    const peerIdStr = peerId.string
    const nextListeners = produce(listeners, draftListeners => {
      draftListeners[peerIdStr].helia = helia
    })
    return nextListeners
  }

  async function download (peerId) {
    const peerIdStr = peerId.string
    console.log('Jim listeners-reducer download peerId', peerId)
    const helia = listeners[peerIdStr].helia
    console.log('Jim listeners-reducer download helia', helia)

    const fs = unixfs(helia)

    const decoder = new TextDecoder()

    const cid = CID.parse('bafkreih24rri3mto2pqfduo57vkuhymckmam3rlfd2plvrirhmp6o5x6mq')

    let text = ''
    try {
      console.log('Downloading', cid)
      for await (const chunk of fs.cat(cid)) {
        text += decoder.decode(chunk, {
          stream: true
        })
      }
      console.log('Decoded text:', text)
    } catch (e) {
      console.error(e)
    }

    return listeners
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

  function addPeer (peerId, remotePeerId) {
    console.log('Jim addPeer', peerId.string, remotePeerId.string)
    const nextListeners = produce(listeners, draftListeners => {
      const nextPeers = produce(draftListeners[peerId.string].peers, draftPeers => {
        if (!draftPeers[remotePeerId.string]) {
          draftPeers[remotePeerId.string] = {
            connected: false
          }
        }
      })
      draftListeners[peerId.string].peers = nextPeers
    })
    return nextListeners
  }

  function updatePeer (peerId, remotePeerId, updatePeerFunc) {
    console.log('Jim updatePeer', peerId.string, remotePeerId.string)
    let nextListeners = addPeer(peerId, remotePeerId)
    nextListeners = produce(nextListeners, draftListeners => {
      const nextPeers = produce(draftListeners[peerId.string].peers, draftPeers => {
        const peer = draftPeers[remotePeerId.string]
        updatePeerFunc(peer)
      })
      draftListeners[peerId.string].peers = nextPeers
    })
    return nextListeners
  }
}
