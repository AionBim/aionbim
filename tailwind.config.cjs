/** Paleta AION (azul da logo). Gera o tailwind.css com: npm run build:css */
module.exports = {
  content: ['./index.html', './script.js', './src/**/*.js'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: '#F4F8FC',
        surface: '#FFFFFF',
        surfaceSubtle: '#E9F0F7',
        ink: {
          DEFAULT: '#0B1320',
          secondary: '#1E293B',
          body: '#334155',
          muted: '#556377'
        },
        ochre: {
          DEFAULT: '#124E85',
          light: '#1FA3C4',
          dark: '#0C3A66'
        }
      },
      fontFamily: {
        heading: ['Manrope', 'sans-serif'],
        sans: ['Manrope', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    }
  }
};
