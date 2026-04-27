import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './apps/web/app/**/*.{ts,tsx}',
    './apps/web/components/**/*.{ts,tsx}',
    './apps/web/lib/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0F172A',
          soft: '#334155',
        },
        steel: '#334155',
        signal: {
          DEFAULT: '#5FA8D3',
          dark: '#3A7CA5',
          pale: '#DDF1FB',
        },
        deepblue: {
          DEFAULT: '#3A7CA5',
          dark: '#0F172A',
        },
        cloud: '#F8FAFC',
        line: '#E2E8F0',
        electric: '#7BC47F',
        mint: '#4CAF50',
      },
      boxShadow: {
        glass: '0 18px 55px rgba(15, 23, 42, 0.08)',
        premium: '0 26px 80px rgba(58, 124, 165, 0.18)',
      },
      keyframes: {
        route: {
          '0%': { strokeDashoffset: '180' },
          '100%': { strokeDashoffset: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseNode: {
          '0%, 100%': { opacity: '0.5', transform: 'scale(0.9)' },
          '50%': { opacity: '1', transform: 'scale(1.18)' },
        },
        layerLift: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '50%': { transform: 'translateY(-8px) translateX(6px)' },
        },
      },
      animation: {
        route: 'route 3.8s linear infinite',
        float: 'float 7s ease-in-out infinite',
        pulseNode: 'pulseNode 2.4s ease-in-out infinite',
        layerLift: 'layerLift 4.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
