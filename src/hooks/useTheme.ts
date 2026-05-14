import { useState, useEffect } from 'react'

const LS_KEY = 'newage_theme'

const VARS = {
  light: {
    '--color-bg':       '241 245 249',
    '--color-surface':  '255 255 255',
    '--color-surface2': '248 250 252',
    '--color-surface3': '226 232 240',
    '--color-border':   '203 213 225',
    '--color-text':     '15 23 42',
    '--color-muted':    '100 116 139',
    '--color-dim':      '148 163 184',
  },
  dark: {
    '--color-bg':       '13 17 23',
    '--color-surface':  '22 27 34',
    '--color-surface2': '13 17 23',
    '--color-surface3': '33 38 45',
    '--color-border':   '48 54 61',
    '--color-text':     '230 237 243',
    '--color-muted':    '139 148 158',
    '--color-dim':      '110 118 129',
  },
} as const

function applyTheme(dark: boolean) {
  const root = document.documentElement
  const vars = dark ? VARS.dark : VARS.light
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v)
  }
  root.classList.toggle('dark', dark)
}

function getInitial(): boolean {
  const saved = localStorage.getItem(LS_KEY)
  if (saved !== null) return saved === 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function useTheme() {
  const [dark, setDark] = useState<boolean>(getInitial)

  useEffect(() => {
    applyTheme(dark)
    localStorage.setItem(LS_KEY, dark ? 'dark' : 'light')
  }, [dark])

  return { dark, toggle: () => setDark(d => !d) }
}
