/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Align with the CSS variables defined in globals.css
        green: {
          '50': 'rgb(var(--green-50))',
          '100': 'rgb(var(--green-100))',
          '200': 'rgb(var(--green-200))',
          '300': 'rgb(var(--green-300))',
          '400': 'rgb(var(--green-400))',
          '500': 'rgb(var(--green-500))',
          '600': 'rgb(var(--green-600))',  // Primary brand color #265c40
          '700': 'rgb(var(--green-700))',
          '800': 'rgb(var(--green-800))',
          '900': 'rgb(var(--green-900))',
        },
        // Backward compatibility colors
        white: 'rgb(255 255 255)',
        black: 'rgb(0 0 0)',
        gray: {
          '50': 'rgb(var(--gray-50))',
          '100': 'rgb(var(--gray-100))',
          '200': 'rgb(var(--gray-200))',
          '300': 'rgb(var(--gray-300))',
          '400': 'rgb(var(--gray-400))',
          '500': 'rgb(var(--gray-500))',
          '600': 'rgb(var(--gray-600))',
          '700': 'rgb(var(--gray-700))',
          '800': 'rgb(var(--gray-800))',
          '900': 'rgb(var(--gray-900))',
        },
        red: {
          '50': 'rgb(254 242 242)',
          '100': 'rgb(254 226 226)',
          '500': 'rgb(239 68 68)',
          '600': 'rgb(220 38 38)',
          '700': 'rgb(185 28 28)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  // Add base defaults to ensure backward compatibility
  plugins: [
    require('tailwindcss-defaults'),
  ],
}; 