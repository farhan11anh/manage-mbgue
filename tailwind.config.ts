/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/client/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#00E5FF',
        secondary: '#FF6B35',
        accent: '#A259FF',
        'bg-dark': '#0A0F1E',
        'bg-card': '#111827',
        'bg-glass': 'rgba(255,255,255,0.05)',
        'text-main': '#F0F6FF',
        'text-muted': '#8892A4',
        success: '#00FF88',
        danger: '#FF4560',
      },
      fontFamily: {
        heading: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      backdropBlur: {
        glass: '12px',
      },
      boxShadow: {
        neon: '0 0 20px rgba(0, 229, 255, 0.5)',
        'neon-accent': '0 0 20px rgba(162, 89, 255, 0.5)',
        'neon-secondary': '0 0 20px rgba(255, 107, 53, 0.5)',
      },
    },
  },
  plugins: [],
};
