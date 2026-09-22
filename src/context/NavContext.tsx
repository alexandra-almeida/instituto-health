import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { NavContext } from './nav-context'

export function NavProvider({ children }: { children: ReactNode }) {
  const [introFinished, setIntroFinished] = useState(false)
  const [brandReady, setBrandReady] = useState(false)
  const brandIconRef = useRef<HTMLImageElement>(null)
  const brandTextRef = useRef<HTMLSpanElement>(null)

  return (
    <NavContext.Provider
      value={{
        introFinished,
        setIntroFinished,
        brandReady,
        setBrandReady,
        brandIconRef,
        brandTextRef,
      }}
    >
      {children}
    </NavContext.Provider>
  )
}
