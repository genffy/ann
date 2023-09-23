// webcomponent.tsx
'use client'
import React, { useEffect } from 'react'
import { defineCustomElements } from 'annotator-react'

const Webcomponents = () => {
  useEffect(() => {
    defineCustomElements()
    return () => {}
  }, [])

  return <></>
}

export default Webcomponents
