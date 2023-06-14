import React, { useState, useEffect, useReducer, useMemo } from 'react'
import { FlyToInterpolator } from '@deck.gl/core'
import { geoToH3 } from 'h3-js'
import { useLocation } from 'react-router-dom'
import hexToUrl from './hex-to-url'
import locations from './locations'
import H3HexagonView from './h3-hexagon-view'
import ResolutionSelect from './resolution-select'
import LocationPicker from './location-picker'
import getPeerIdFromH3Hex from './deterministic-peer-id'
import WebRTCPanel from './webrtc-panel'
import cellsReducer from './cells-reducer'
import listenersReducer from './listeners-reducer'

export default function H3HexagonMVT ({ homeLinkCounter }) {
  const [resolution, setResolution] = useState(12)

  const [cells, dispatchCellsAction] = useReducer(cellsReducer, {})

  const [nextColor, setNextColor] = useState(0)
  const location = useLocation()
  const [initialViewState, setInitialViewState] = useState({
    ...locations.yyj,
    maxZoom: 20,
    minZoom: 1
  })
  const [viewState, setViewState] = useState({})
  const [selectedHex, setSelectedHex] = useState()
  const selectedHexBase32 = useMemo(
    () => (selectedHex ? hexToUrl(selectedHex[1]) : ''),
    [selectedHex]
  )
  const [peerId, setPeerId] = useState()
  useEffect(() => {
    setPeerId(null)
    if (selectedHex) {
      async function run () {
        const peerId = await getPeerIdFromH3Hex(selectedHex[1])
        setPeerId(peerId)
      }
      run()
    }
  }, [selectedHex])

  useEffect(() => {
    const key = location.search.replace('?loc=', '')
    if (locations[key]) {
      const initialViewState = {
        ...locations[key],
        transitionInterpolator: new FlyToInterpolator({
          speed: 1.5
        }),
        transitionDuration: 'auto',
        maxZoom: 20,
        minZoom: 1
      }
      setInitialViewState(initialViewState)
    }
  }, [location])

  useEffect(() => {
    const initialViewState = {
      ...locations.yyj,
      transitionInterpolator: new FlyToInterpolator({
        speed: 1.5
      }),
      transitionDuration: 'auto',
      maxZoom: 20,
      minZoom: 1
    }
    setInitialViewState(initialViewState)
  }, [homeLinkCounter])

  const [listeners, dispatchListenersAction] = useReducer(listenersReducer, {})
  useEffect(() => {
    async function fetchData () {
      const response = await fetch(process.env.PUBLIC_URL + '/data.json')
      const data = await response.json()
      dispatchCellsAction({ type: 'initData', data: data.solid })
      setViewState(data.viewState)
    }
    fetchData()
  }, [setViewState])

  function pushLatLng (lat, lng) {
    if (location.pathname !== '/') return
    const hex = geoToH3(lat, lng, resolution)
    const colorIndex = nextColor % 10
    const newDataPoint = {
      hex,
      // count: 30 * (9.682 - Math.log((resolution + 1) * 1000)),
      count:
        1000 * (1 / Math.log((resolution + 2) * (resolution + 2)) / 10) - 17.5,
      colorIndex,
      type: 'No type',
      label: 'Unlabeled'
    }
    setNextColor(colorIndex + 1)
    dispatchCellsAction({ type: 'addCell', cell: newDataPoint })
  }

  function pickHex (layer, hex) {
    setSelectedHex([layer, hex])
  }

  function removeHex (layer, hexToRemove) {
    dispatchCellsAction({ type: 'removeHex', hex: hexToRemove })
  }

  return (
    <div>
      {location.pathname === '/' && (
        <div style={{ display: 'flex' }}>
          <ResolutionSelect
            resolution={resolution}
            setResolution={setResolution}
          />
          <LocationPicker flatten={flatten} />
        </div>
      )}
      <div style={{ display: 'flex' }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '70vh',
            background: '#64828c'
          }}
        >
          <H3HexagonView
            cells={cells}
            initialViewState={initialViewState}
            setInitialViewState={setInitialViewState}
            pushLatLng={pushLatLng}
            pickHex={pickHex}
            setViewState={setViewState}
            selectedHex={selectedHex}
            setSelectedHex={setSelectedHex}
          />
        </div>
        {location.pathname === '/' && (
          <div style={{ width: '100%' }}>
            <h3>Selected</h3>
            {selectedHex && (
              <>
                <div>Remote?: {cells.index[selectedHex[1]]?.remote ? 'True' : 'False'}</div>
                <div>Type: {cells.index[selectedHex[1]]?.type}</div>
                <div>Label: {cells.index[selectedHex[1]]?.label}</div>
                <div>
                  Hex: {selectedHex[1]} {selectedHex[0]}
                </div>
                <div>Base32: {selectedHexBase32}</div>
                <div>
                  Hex.Camp URL:{' '}
                  <a href={`https://${selectedHexBase32}.hex.camp`}>
                    {selectedHexBase32}.hex.camp
                  </a>
                </div>
                <div style={{ fontSize: 'small' }}>
                  PeerID: {`${peerId}`}
                </div>
                <div>
                  <button
                    onClick={() => {
                      removeHex(selectedHex[0], selectedHex[1])
                      setSelectedHex(null)
                    }}
                  >
                    Delete
                  </button>
                  <button onClick={() => setSelectedHex(null)}>Deselect</button>
                </div>
                {peerId && (
                  <WebRTCPanel
                    hex={selectedHex[1]}
                    peerId={peerId}
                    listeners={listeners}
                    dispatchListenersAction={dispatchListenersAction}
                    dispatchCellsAction={dispatchCellsAction}
                  />
                )}
              </>
            )}
            <h3>View State</h3>
            <details>
              <pre>
                {JSON.stringify(viewState, null, 2)}
              </pre>
            </details>
            <h3>Cells</h3>
            <details>
              <pre>
                {JSON.stringify(cells, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
      {location.pathname === '/' && (
        <div style={{ padding: '0.5rem' }}>
          {selectedHex ? (
            <>
              {cells.index[selectedHex[1]].type}:
              <a href={`https://${selectedHexBase32}.hex.camp`}>
                {cells.index[selectedHex[1]].label}
              </a>
            </>
          ) : (
            <span>No hexagon selected.</span>
          )}
        </div>
      )}
    </div>
  )

  function flatten (event) {
    const initialViewState = {
      ...viewState,
      pitch: 0,
      bearing: 0,
      transitionInterpolator: new FlyToInterpolator(),
      transitionDuration: 1000
    }
    setInitialViewState(initialViewState)
    event.preventDefault()
  }
}
