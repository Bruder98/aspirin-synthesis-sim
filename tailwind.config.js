/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lab: {
          950: '#060B11',
          900: '#0C131D',
          850: '#111A27',
          800: '#172233',
          700: '#213047',
          600: '#2E4160',
          500: '#435B80',
        },
        chem: {
          cyan: '#06B6D4',
          'cyan-dim': 'rgba(6, 182, 212, 0.15)',
          'cyan-glow': '0 0 20px rgba(6, 182, 212, 0.35)',
          water: '#38BDF8',
          amber: '#F59E0B',
          'amber-dim': 'rgba(245, 158, 11, 0.15)',
          emerald: '#10B981',
          'emerald-dim': 'rgba(16, 185, 129, 0.15)',
          crimson: '#EF4444',
          'crimson-dim': 'rgba(239, 68, 68, 0.15)',
          crystal: '#F8FAFC',
          purple: '#A855F7',
        }
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.35)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.35)',
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.35)',
        'crystal-card': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 15px 1px rgba(248, 250, 252, 0.1)',
      }
    },
  },
  plugins: [],
};
