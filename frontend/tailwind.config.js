/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a', // slate-900
        card: 'rgba(30, 41, 59, 0.7)', // slate-800 with opacity for glassmorphism
        cardBorder: 'rgba(51, 65, 85, 0.5)', // slate-700
        primary: '#3b82f6', // blue-500
        secondary: '#8b5cf6', // violet-500
        accent: '#10b981', // emerald-500
        textMain: '#f8fafc', // slate-50
        textMuted: '#94a3b8', // slate-400
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(to right, #3b82f6, #8b5cf6)',
      }
    },
  },
  plugins: [],
}
