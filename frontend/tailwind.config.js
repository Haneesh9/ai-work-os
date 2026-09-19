/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          light: '#F6F7F7',
          dark: '#0E161A',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#151D21',
          subtleLight: '#E7EAEA',
          subtleDark: '#1C262B',
        },
        border: {
          light: '#DDE2E3',
          dark: '#29343A',
        },
        primaryText: {
          light: '#0E161A',
          dark: '#E7EAEA',
        },
        secondaryText: {
          light: '#586469',
          dark: '#A8B3B7',
        },
        accent: {
          DEFAULT: '#65749E',
          hover: '#54638c',
        },
        aiAccent: {
          DEFAULT: '#BDB2CE',
          subtle: 'rgba(189, 178, 206, 0.15)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
