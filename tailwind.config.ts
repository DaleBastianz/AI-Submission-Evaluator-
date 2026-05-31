import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        edu: {
          logo: 'var(--edu-logo-bg)',
          page: 'var(--edu-page-bg)',
          surface: 'var(--edu-surface)',
          border: 'var(--edu-border)',
          text: 'var(--edu-text)',
          muted: 'var(--edu-text-muted)',
          accent: 'var(--edu-accent)'
        }
      },
      boxShadow: {
        glow: '0 20px 60px rgba(6, 182, 212, 0.12)'
      }
    }
  },
  plugins: []
};

export default config;
