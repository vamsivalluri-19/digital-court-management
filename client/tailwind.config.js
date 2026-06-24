/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1', // Indigo
          600: '#4f46e5',
          700: '#4338ca',
        },
        secondary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6', // Blue
          600: '#2563eb',
        },
        success: {
          500: '#10b981', // Emerald
        },
        warning: {
          500: '#f97316', // Orange
        },
        error: {
          500: '#ef4444', // Red
        }
      }
    },
  },
  plugins: [],
}
