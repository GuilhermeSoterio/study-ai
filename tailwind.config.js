/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#07070f',
        surface:  '#0f0f1d',
        surface2: '#17172a',
        surface3: '#1e1e35',
        border:   '#28283f',
        primary:  '#7c3aed',
        primary2: '#9d4edd',
        accent:   '#06b6d4',
        success:  '#10b981',
        warning:  '#f59e0b',
        danger:   '#ef4444',
        text:     '#eeeeff',
        muted:    '#7878a0',
        dim:      '#3a3a58',
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
