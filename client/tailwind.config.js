export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        dark: '#1F2937',
        light: '#F3F4F6',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
