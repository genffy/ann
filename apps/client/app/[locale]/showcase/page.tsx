'use client'
import { MyComponent } from 'annotator-react'

export default function Showcase() {
  return (
    <>
      <div className="min-h-[100vh] w-screen flex justify-center">
        <div className='max-w-[80%]'>再别康桥</div>
      </div>
      <MyComponent first="Stencil" last="'Don't call me a framework' JS" />
    </>
  )
}
