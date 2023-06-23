import React, { useState, useEffect } from 'react'
import useListener from './useListener'
import { kRing } from 'h3-js'
import getPeerIdFromH3Hex from './deterministic-peer-id'
import hexToUrl from './hex-to-url'

export default function WebRTCPanel ({
  hex,
  peerId,
  listeners,
  dispatchListenersAction,
  dispatchCellsAction,
  addHex
}) {
  const [neighbours, setNeighbours] = useState(new Map())
  useEffect(() => {
    (async () => {
      const hexes = kRing(hex, 1)
      const promises = []
      for (const neighbour of hexes) {
        if (neighbour === hex) continue
        promises.push(async function() {
          const peerId = await getPeerIdFromH3Hex(neighbour)
          return [peerId.toString(), neighbour]
        }())
      }
      const peerIdToHex = await Promise.all(promises)
      setNeighbours(new Map(peerIdToHex))
    })()
  }, [hex, setNeighbours])

  const [listener, create] = useListener(
    peerId,
    listeners,
    neighbours,
    dispatchListenersAction,
    dispatchCellsAction,
    addHex
  )

  function download () {
    console.log("Jim download")
    dispatchListenersAction({ type: 'download', peerId })
  }

  if (!listener) {
    return (
      <div>
        Not listening
        <button onClick={create}>Listen</button>
      </div>
    )
  }

  const { peers, logs } = listener
  return (
    <div>
      <h3>Download</h3>
      <button onClick={download}>Download demo text</button>
      <h3>Peers</h3>
      <ul>
        {Object.keys(peers).map(remotePeerId => {
          const peer = peers[remotePeerId]
          return (
            peer.connected && <li key={remotePeerId}>
              {hexToUrl(neighbours.get(remotePeerId))}
              &nbsp;
              &nbsp;
              ({remotePeerId.slice(-3)})
            </li>
          )
        })}
      </ul>
      <h3>Logs</h3>
      {logs.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  )
}
