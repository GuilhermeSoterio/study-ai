/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#f1f5f9',
        surface:  '#ffffff',
        surface2: '#f8fafc',
        surface3: '#e2e8f0',
        border:   '#cbd5e1',
        primary:  '#4a7c59',
        primary2: '#3a6648',
        accent:   '#d4a017',
        success:  '#4a7c59',
        warning:  '#d4a017',
        danger:   '#c0392b',
        text:     '#0f172a',
        muted:    '#64748b',
        dim:      '#94a3b8',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
        sm:   '8px',
      },
    },
  },
  plugins: [],
}
