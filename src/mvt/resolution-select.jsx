import React from 'react'

export default function ({ resolution, setResolution }) {
  function handleChange (event) {
    setResolution(Number(event.target.value))
  }

  return (
    <div>
      Resolution:{' '}
      <select onChange={handleChange} value={resolution}>
        <option value='0'>0 Global Region</option>
        <option value='1'>1 Large Region</option>
        <option value='2'>2 Medium Region</option>
        <option value='3'>3 Small Region</option>
        <option value='4'>4 Metro</option>
        <option value='5'>5 City</option>
        <option value='6'>6 Borough / Ward</option>
        <option value='7'>7 Large Neighbourhood</option>
        <option value='8'>8 Medium Neighbourhood</option>
        <option value='9'>9 Small Neighbourhood</option>
        <option value='10'>10 City Block</option>
        <option value='11'>11 Large Building</option>
        <option value='12'>12 Medium Building</option>
        <option value='13'>13 Small Building / Shop</option>
        <option value='14'>14 Group of People</option>
        <option value='15'>15 Person</option>
      </select>
    </div>
  )
}
