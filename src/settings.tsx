import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type TextSize = 'sm' | 'md' | 'lg' | 'xl'
export type Paper = 'cream' | 'white' | 'sepia'

export type Settings = {
  name: string
  textSize: TextSize
  paper: Paper
  showFriendNotes: boolean
}

export const TEXT_SIZES: Record<TextSize, string> = { sm: '90%', md: '100%', lg: '115%', xl: '130%' }
export const PAPERS: Record<Paper, string> = { cream: '#fffdf7', white: '#ffffff', sepia: '#f4ead3' }

const KEY = 'amity:settings'
const defaults: Settings = { name: 'Reader', textSize: 'md', paper: 'cream', showFriendNotes: true }

const load = (): Settings => {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return defaults
  }
}

type Ctx = {
  settings: Settings
  update: (patch: Partial<Settings>) => void
  open: boolean
  setOpen: (open: boolean) => void
}

const SettingsContext = createContext<Ctx | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(load)
  const [open, setOpen] = useState(false)
  useEffect(() => localStorage.setItem(KEY, JSON.stringify(settings)), [settings])
  return (
    <SettingsContext.Provider value={{ settings, update: (p) => setSettings((s) => ({ ...s, ...p })), open, setOpen }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
  return ctx
}

export const resetDemoData = () => {
  Object.keys(localStorage)
    .filter((k) => k.startsWith('amity:'))
    .forEach((k) => localStorage.removeItem(k))
}
