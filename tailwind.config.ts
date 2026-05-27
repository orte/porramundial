import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta deportiva clásica: verde césped + dorado trofeo
        pitch: {
          50: '#f0f7f0',
          100: '#dceedc',
          200: '#b8ddb8',
          300: '#88c388',
          400: '#5aa55a',
          500: '#3a883a',
          600: '#2a6e2a',
          700: '#225822',
          800: '#1c461c',
          900: '#173817',
          950: '#0c1f0c',
        },
        trophy: {
          50: '#fdfaf1',
          100: '#faf2dc',
          200: '#f3e1b3',
          300: '#eac881',
          400: '#e1ab51',
          500: '#d8932f',
          600: '#c07a23',
          700: '#9e5d1f',
          800: '#824a20',
          900: '#6c3e1d',
          950: '#3e1f0d',
        },
        ink: {
          50: '#f6f6f5',
          100: '#e7e7e5',
          200: '#d1d1cc',
          300: '#b0b0a8',
          400: '#88887e',
          500: '#6d6d63',
          600: '#585850',
          700: '#484842',
          800: '#3d3d39',
          900: '#363632',
          950: '#1f1f1d',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      backgroundImage: {
        'pitch-stripes':
          'repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 60px, transparent 60px, transparent 120px)',
      },
    },
  },
  plugins: [],
};

export default config;
