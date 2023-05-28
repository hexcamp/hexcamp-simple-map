import produce from 'immer'
import { h3GetResolution } from 'h3-js'

export default function cellsReducer (cells, action) {
  const { type, data, cell, hex, extra } = action
  switch (type) {
    case 'initData':
      return {
        data,
        nextColor: 0,
        index: {}
      }
    case 'addCell':
      return addCell(cell)
    case 'addHex':
      return addHex(hex, extra)
    case 'removeHex':
      return removeHex(hex)
    default:
      throw new Error()
  }

  function addCell (newCell) {
    const nextCells = produce(cells, draftCells => {
      draftCells.data.push(newCell)
      draftCells.index[newCell.hex] = newCell
    })
    return nextCells
  }

  function addHex (hex, extra) {
    const colorIndex = cells.nextColor % 10
    const resolution = h3GetResolution(hex)
    let newCell = {
      hex,
      // count: 30 * (9.682 - Math.log((resolution + 1) * 1000)),
      count:
        1000 * (1 / Math.log((resolution + 2) * (resolution + 2)) / 10) - 17.5,
      colorIndex,
      type: 'No type',
      label: 'Unlabeled'
    }
    if (extra) {
      newCell = {
        ...newCell,
        ...extra
      }
    }
    const nextCells = produce(cells, draftCells => {
      draftCells.data.push(newCell)
      draftCells.index[newCell.hex] = newCell
      draftCells.nextColor++
    })
    return nextCells
  }

  function removeHex (hexToRemove) {
    const nextCells = produce(cells, draftCells => {
      draftCells.data = draftCells.data.filter(({ hex }) => hex !== hexToRemove)
      delete draftCells[hex]
    })
    return nextCells
  }

  /*
  const { type, peerId, libp2pNode, remotePeerId } = action
  switch (type) {
    case 'startListening':
      return startListening(peerId)
    case 'addLibp2pNode':
      return addLibp2pNode(peerId, libp2pNode)
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
  */
}
