/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Cores neutras via CSS variables (suportam modificadores de opacidade: bg-bg/50)
        bg:       'rgb(var(--color-bg)       / <alpha-value>)',
        surface:  'rgb(var(--color-surface)  / <alpha-value>)',
        surface2: 'rgb(var(--color-surface2) / <alpha-value>)',
        surface3: 'rgb(var(--color-surface3) / <alpha-value>)',
        border:   'rgb(var(--color-border)   / <alpha-value>)',
        text:     'rgb(var(--color-text)     / <alpha-value>)',
        muted:    'rgb(var(--color-muted)    / <alpha-value>)',
        dim:      'rgb(var(--color-dim)      / <alpha-value>)',
        // Cores semânticas — fixas em ambos os temas
        primary:  '#4a7c59',
        primary2: '#3a6648',
        accent:   '#d4a017',
        success:  '#4a7c59',
        warning:  '#d4a017',
        danger:   '#c0392b',
      },
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        display: ['Rajdhani', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
        sm:   '8px',
      },
    },
  },
  plugins: [],
}
