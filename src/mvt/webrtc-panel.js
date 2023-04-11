import React, { useMemo } from 'react'
import useListener from './useListener'
import { kRing } from 'h3-js'
import getPeerIdFromH3Hex from './deterministic-peer-id'

export default function WebRTCPanel ({
  hex,
  peerId,
  listeners,
  dispatchListenersAction
}) {
  const neighbours = useMemo(async () => {
    const hexes = kRing(hex, 1)
    const promises = []
    for (const neighbour of hexes) {
      if (neighbour === hex) continue
      promises.push(getPeerIdFromH3Hex(neighbour))
    }
    const peerIds = await Promise.all(promises)
    return new Set(peerIds.map(peerId => peerId.toString()))
  }, [hex])

  const [listener, create, log, dial] = useListener(
    peerId,
    listeners,
    dispatchListenersAction,
    neighbours
  )

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
      <h3>Peers</h3>
      Hex: ${hex}
      <ul>
        {Object.keys(peers).map(remotePeerId => {
          const peer = peers[remotePeerId]
          return (
            <li key={remotePeerId}>
              {remotePeerId.slice(-3)}{' '}
              {peer.connected ? 'Connected' : 'Disconnected'}
              {!peer.connected && <button onClick={connect}>Connect</button>}
            </li>
          )
          function connect () {
            log(`Dialing ${remotePeerId}`)
            dial(remotePeerId)
            log(`Dialed ${remotePeerId}`)
          }
        })}
      </ul>
      <h3>Logs</h3>
      {logs.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  )
}
