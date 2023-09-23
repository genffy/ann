'use client'
import { MyComponent } from 'annotator-react'

export default function Showcase() {
  return (
    <div className="min-h-[100vh] sm:min-h-screen w-screen flex flex-col relative bg-[#F2F3F5] font-inter overflow-hidden">
      <MyComponent first="Stencil" last="'Don't call me a framework' JS" />
    </div>
  )
}
