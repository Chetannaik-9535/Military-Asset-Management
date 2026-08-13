/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ops: {
          black: '#12160F',
          panel: '#1B211A',
          raised: '#232B20',
          border: '#343F2C',
          paper: '#E9E6D8',
          muted: '#8B9382',
          amber: '#D6A93A',
          moss: '#7C9A5E',
          rust: '#B4462F',
          steel: '#5B7480',
        },
      },
      fontFamily: {
        display: ['"Chakra Petch"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'grid-texture':
          'linear-gradient(rgba(233,230,216,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(233,230,216,0.035) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '28px 28px',
      },
    },
  },
  plugins: [],
};
