import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/extension/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        forge: {
          cyan: '#00f0ff',
          violet: '#a855f7',
          zinc: '#09090b'
        }
      },
      boxShadow: {
        forge: '0 18px 60px rgba(0, 240, 255, 0.18)'
      }
    }
  },
  plugins: []
};

export default config;
