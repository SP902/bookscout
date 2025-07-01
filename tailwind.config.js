/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb', // blue-600
          light: '#60a5fa',  // blue-400
          dark: '#1e40af',   // blue-800
        },
        accent: {
          DEFAULT: '#06b6d4', // cyan-500
          light: '#67e8f9',   // cyan-300
          dark: '#0e7490',    // cyan-700
        },
        glass: 'rgba(255,255,255,0.12)',
        darkglass: 'rgba(24, 28, 35, 0.45)',
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'ui-sans-serif', 'system-ui'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.5' }],
        sm: ['0.875rem', { lineHeight: '1.5' }],
        base: ['1rem', { lineHeight: '1.7' }],
        lg: ['1.125rem', { lineHeight: '1.7' }],
        xl: ['1.25rem', { lineHeight: '1.7' }],
        '2xl': ['1.5rem', { lineHeight: '1.2' }],
        '3xl': ['1.875rem', { lineHeight: '1.2' }],
        '4xl': ['2.25rem', { lineHeight: '1.1' }],
        '5xl': ['3rem', { lineHeight: '1.1' }],
        '6xl': ['3.75rem', { lineHeight: '1.05' }],
      },
      borderRadius: {
        DEFAULT: '1rem',
        xl: '1.5rem',
        '2xl': '2rem',
        pill: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(16,30,54,0.07)',
        DEFAULT: '0 2px 8px 0 rgba(16,30,54,0.10)',
        md: '0 4px 16px 0 rgba(16,30,54,0.12)',
        lg: '0 8px 32px 0 rgba(16,30,54,0.16)',
        glass: '0 8px 32px 0 rgba(16,30,54,0.18), 0 1.5px 6px 0 rgba(0,0,0,0.04)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '16px',
      },
      transitionTimingFunction: {
        'in-out-cubic': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        'pop': {
          '0%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s both',
        'pop': 'pop 0.2s both',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
}; 