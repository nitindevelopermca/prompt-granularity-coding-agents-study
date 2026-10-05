import { createContext, useContext } from 'react'

const ShellInertContext = createContext<(inert: boolean) => void>(() => {})

export const ShellInertProvider = ShellInertContext.Provider

export function useShellInert(): (inert: boolean) => void {
  return useContext(ShellInertContext)
}
