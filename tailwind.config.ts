import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0d0d0d',
        panel: '#11151f',
        accent: '#00d4aa',
        card: 'rgba(255,255,255,0.04)' 
      },
      boxShadow: {
        glow: '0 20px 60px rgba(0, 212, 170, 0.18)'
      }
    }
  },
  plugins: []
};

export default config;
