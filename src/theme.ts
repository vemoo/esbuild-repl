import { $ } from './utils'

const darkTheme = window.matchMedia('(prefers-color-scheme: dark)')

export let theme =
  (localStorage.getItem('esbuild-repl:theme') as 'light' | 'dark' | null) ||
  (darkTheme.matches ? 'dark' : 'light')

document.body.dataset.theme = theme

darkTheme.addEventListener('change', event => {
  document.body.dataset.theme = event.matches ? 'dark' : 'light'
})

export function setTheme(theme_: 'light' | 'dark') {
  theme = theme_
  localStorage.setItem('esbuild-repl:theme', theme)
  document.body.dataset.theme = theme
}

export function toggleTheme(theme_?: 'light' | 'dark') {
  theme = theme_ || (theme === 'dark' ? 'light' : 'dark')
  localStorage.setItem('esbuild-repl:theme', theme)
  document.body.dataset.theme = theme
}

export function resetTheme() {
  theme = darkTheme.matches ? 'dark' : 'light'
  localStorage.removeItem('esbuild-repl:theme')
  document.body.dataset.theme = theme
}

export function onThemeChange(callback: (ev: MediaQueryListEvent) => void) {
  darkTheme.addEventListener('change', callback)
}

const toggleThemeButton = $('#toggle-theme')
if (toggleThemeButton) {
  toggleThemeButton.addEventListener('click', () => toggleTheme())
  toggleThemeButton.addEventListener('contextmenu', e => {
    e.preventDefault()
    resetTheme()
  })
}
