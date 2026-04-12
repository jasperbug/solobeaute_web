import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: '#9B6B7A',
        'brand-light': '#C8A0AD',
        accent: '#C4A265',
        surface: '#FAFAF7',
        'surface-warm': '#F5F3EE',
        ink: '#2C2C2C',
      },
      borderRadius: {
        card: '20px',
      },
      boxShadow: {
        soft: '0 8px 40px rgba(0, 0, 0, 0.05)',
      },
      maxWidth: {
        container: '1080px',
      },
    },
  },
  plugins: [],
}

export default config
