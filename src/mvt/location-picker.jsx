import React from 'react'
import styled from 'styled-components'

const StyledA = styled.a`
  margin-left: 0.3rem;
`

export default function ({ flatten }) {
  const base = document.location.href.replace(/\?.*/, '')
  const genUrl = airportCode => base + '?loc=' + airportCode
  return (
    <div>
      <StyledA href={genUrl('yyj')}>YYJ</StyledA>
      <StyledA href={genUrl('sfo')}>SFO</StyledA>
      <StyledA href={genUrl('yvr')}>YVR</StyledA>
      <StyledA href={genUrl('lhr')}>LHR</StyledA>
      <StyledA href={genUrl('hnd')}>HND</StyledA>
      <StyledA href={genUrl('jfk')}>JFK</StyledA>
      <StyledA href={genUrl('bom')}>BOM</StyledA>
      <StyledA href={genUrl('tfn')}>TFN</StyledA>
      <StyledA href={base} onClick={flatten}>
        Flat
      </StyledA>
    </div>
  )
}
