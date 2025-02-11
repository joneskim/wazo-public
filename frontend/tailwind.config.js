/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'wazo-primary': '#3B82F6',
        'wazo-secondary': '#10B981',
        'wazo-background': '#F3F4F6',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      typography: {
        DEFAULT: {
          css: {
            pre: {
              backgroundColor: 'transparent',
            },
            'pre code': {
              backgroundColor: 'transparent',
              color: 'inherit',
            },
          },
        },
      },
      animation: {
        'slideDown': 'slideDown 0.5s ease-out',
        'fadeIn': 'fadeIn 1s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'floatReverse': 'floatReverse 7s ease-in-out infinite',
      },
      keyframes: {
        slideDown: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0)' },
          '50%': { transform: 'translate(20px, -20px) rotate(10deg)' },
        },
        floatReverse: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0)' },
          '50%': { transform: 'translate(-20px, 20px) rotate(-10deg)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
