import { useContext } from 'react'
import { NavContext } from './nav-context'

export function useNav() {
  const ctx = useContext(NavContext)
  if (!ctx) throw new Error('useNav deve ser usado dentro de NavProvider')
  return ctx
}
