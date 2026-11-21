import { createContext, useContext } from 'react'

export const DirectoryContext = createContext(null)

export function useDirectory() {
  const ctx = useContext(DirectoryContext)
  if (!ctx) throw new Error('useDirectory must be used inside <DirectoryProvider>')
  return ctx
}
