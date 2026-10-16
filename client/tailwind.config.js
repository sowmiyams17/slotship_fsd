/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        mirage:    '#16232A',
        'dark-card': '#20343B',
        'dark-hover':'#29434B',
        'dark-border':'#38515A',
        blaze:     '#FF5B04',
        'blaze-dark': '#E04F00',
        deepsea:   '#075056',
        'soft-white': '#F5F8F9',
        'muted':   '#A9BBC0',
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'blaze-glow': 'radial-gradient(ellipse at 0% 50%, rgba(255,91,4,0.12) 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
}
